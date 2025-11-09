from __future__ import annotations

import re
from functools import lru_cache
from typing import List, Iterable

_WORDNET_READY = False
wn = None
wordpunct_tokenize = None

try:
    import nltk
    from nltk.corpus import wordnet as _wn
    from nltk.tokenize import wordpunct_tokenize as _wordpunct_tokenize

    wn = _wn
    wordpunct_tokenize = _wordpunct_tokenize

    try:
        wn.synsets("test")
        _WORDNET_READY = True
    except LookupError:
        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)
        try:
            wn.synsets("test")
            _WORDNET_READY = True
        except Exception:
            _WORDNET_READY = False
except Exception:
    _WORDNET_READY = False
    wn = None
    wordpunct_tokenize = None


class NameStandardizer:
    """
    NLTK-enhanced name standardizer with a simple, general hybrid splitter:
      - delimiter/camel/acronym handling
      - fused lowercase tokens: suffix-first single 2-way split
    """

    # ---------- Tunables ----------
    MIN_SPLIT_PIECE = 3                  # never accept pieces shorter than this
    MIN_STRONG_LEN = 4                   # wordnet/domain words count as "strong" when len >= 4
    MAX_UNKNOWN_PLAUSIBLE = 6            # allow unknown half up to this length in strong+unknown splits
    REQUIRE_VOWEL_FOR_UNKNOWN = True     # plausible unknown must have both vowels and consonants
    # --------------------------------

    ACRONYMS: set[str] = {
        "API","HTTP","HTTPS","URL","URI","UI","UX","SDK",
        "ID","DB","SQL","CLI","CPU","GPU","AWS","SSO","JWT",
        "TS","JS","CSV","XML","JSON","YAML","TLS","SSH","S3",
    }

    # Common UI/domain words (extend at runtime)
    DOMAIN_WORDS: set[str] = {
        "game","center","test","play","area","page","wrapper","actions",
        "hook","store","config","nav","navigation","list","item","detail",
        "view","button","card","modal","sheet","drawer","panel","manager",
        "service","provider","settings","profile","user","work","admin",
        "dash","board",
    }

    # Suffixes we prefer to split on (longest first)
    SUFFIX_WORDS: List[str] = sorted(
        [
            "navigation","provider","manager","service","settings","profile",
            "wrapper","actions","center","drawer","detail","button","modal",
            "page","panel","store","view","card","list","item","area",
            "dash","board","nav",
        ],
        key=len, reverse=True,
    )

    _WORD_RE = re.compile(
        r"""
        [A-Z]{2,}(?=[A-Z][a-z]|[0-9]|\b) |
        [A-Z]?[a-z]+(?=[A-Z]|[0-9]|\b)   |
        [0-9]+
        """,
        re.VERBOSE,
    )
    _VOWELS = set("aeiou")

    # ---------- basic tokenization ----------

    @staticmethod
    def _normalize_delims(name: str) -> List[str]:
        if not name:
            return []
        coarse = re.sub(r"[^\w\d]+", " ", name.strip())
        parts = coarse.split()
        if wordpunct_tokenize is None:
            return parts
        refined: List[str] = []
        for p in parts:
            refined.extend([t for t in wordpunct_tokenize(p) if t.strip()])
        return refined or parts

    @staticmethod
    def _split_atomic(token: str) -> List[str]:
        matches = NameStandardizer._WORD_RE.findall(token)
        return matches if matches else [token]

    # ---------- dictionary helpers ----------

    @staticmethod
    def _is_wordnet_word(t: str) -> bool:
        if not _WORDNET_READY or wn is None:
            return False
        if wn.synsets(t):
            return True
        # quick morphology tries
        if t.endswith("s") and wn.synsets(t[:-1]):
            return True
        if t.endswith("es") and wn.synsets(t[:-2]):
            return True
        if t.endswith("ed") and wn.synsets(t[:-2]):
            return True
        if t.endswith("ing") and wn.synsets(t[:-3]):
            return True
        return False

    @staticmethod
    def _is_strong_word(t: str) -> bool:
        t = t.lower()
        if len(t) < NameStandardizer.MIN_STRONG_LEN:
            return False
        if t in NameStandardizer.DOMAIN_WORDS:
            return True
        return NameStandardizer._is_wordnet_word(t)

    @staticmethod
    def _is_weak_word(t: str) -> bool:
        return len(t) == 3 and NameStandardizer._is_wordnet_word(t)

    @staticmethod
    def _is_plausible_unknown(t: str) -> bool:
        t = t.lower()
        L = len(t)
        if L < NameStandardizer.MIN_STRONG_LEN or L > NameStandardizer.MAX_UNKNOWN_PLAUSIBLE:
            return False
        if not t.isalpha():
            return False
        if not NameStandardizer.REQUIRE_VOWEL_FOR_UNKNOWN:
            return True
        has_vowel = any(c in NameStandardizer._VOWELS for c in t)
        has_consonant = any(c.isalpha() and c not in NameStandardizer._VOWELS for c in t)
        return has_vowel and has_consonant

    # ---------- conservative fused splitter (suffix-first) ----------

    @staticmethod
    @lru_cache(maxsize=8192)
    def _split_fused_suffix_first(token: str) -> List[str] | None:
        """
        Try one 2-way split using suffix-first heuristics.

        Rules:
          - If whole token is a strong word (len >= 4), keep it whole.
          - For each suffix in SUFFIX_WORDS (longest first):
              * if token endswith suffix and left len >= MIN_SPLIT_PIECE:
                  accept if:
                    A) left strong AND right strong, OR
                    B) (left strong AND right weak) OR (right strong AND left weak), OR
                    C) one side strong AND the other plausible unknown (len 4..MAX_UNKNOWN_PLAUSIBLE, vowel+consonant)
          - If none qualifies, return None (keep whole).
        """
        s = token.lower()
        n = len(s)
        if n < (2 * NameStandardizer.MIN_SPLIT_PIECE):
            return None

        if NameStandardizer._is_strong_word(s):
            return None  # keep whole (e.g., "dashboard")

        for suf in NameStandardizer.SUFFIX_WORDS:
            if not s.endswith(suf):
                continue
            i = n - len(suf)
            if i < NameStandardizer.MIN_SPLIT_PIECE:
                continue
            left, right = s[:i], s[i:]

            left_strong = NameStandardizer._is_strong_word(left)
            right_strong = NameStandardizer._is_strong_word(right)
            left_weak = NameStandardizer._is_weak_word(left)
            right_weak = NameStandardizer._is_weak_word(right)

            if left_strong and right_strong:
                return [left, right]
            if (left_strong and right_weak) or (right_strong and left_weak):
                return [left, right]
            if (left_strong and NameStandardizer._is_plausible_unknown(right)) or (
                right_strong and NameStandardizer._is_plausible_unknown(left)
            ):
                return [left, right]

        return None

    # ---------- token pipeline ----------

    @staticmethod
    def _split_to_words(name: str) -> List[str]:
        pieces = NameStandardizer._normalize_delims(name)
        tokens: List[str] = []

        for part in pieces:
            chunks = NameStandardizer._split_atomic(part)
            for ch in chunks:
                if ch.isdigit():
                    tokens.append(ch)
                    continue
                if ch.isupper() and len(ch) > 1:
                    tokens.append(ch)  # acronym
                    continue

                # try suffix-first fused split only for plain lowercase alpha strings
                if (
                    _WORDNET_READY
                    and ch.isalpha()
                    and ch.islower()
                    and len(ch) >= (2 * NameStandardizer.MIN_SPLIT_PIECE)
                ):
                    split = NameStandardizer._split_fused_suffix_first(ch)
                    if split:
                        tokens.extend(split)
                        continue

                tokens.append(ch)
        return tokens

    # ---------- public API ----------

    @staticmethod
    def to_pascal_case(name: str) -> str:
        words = NameStandardizer._split_to_words(name)
        parts: List[str] = []
        for w in words:
            if w.isdigit():
                parts.append(w)
            elif w.isupper() and len(w) > 1:
                parts.append(w)  # acronym
            else:
                up = w.upper()
                parts.append(up if up in NameStandardizer.ACRONYMS else w.lower().capitalize())
        return "".join(parts)

    @staticmethod
    def to_camel_case(name: str) -> str:
        pascal = NameStandardizer.to_pascal_case(name)
        return pascal[:1].lower() + pascal[1:] if pascal else ""

    @staticmethod
    def to_kebab_case(name: str) -> str:
        words = NameStandardizer._split_to_words(name)
        return "-".join(w.lower() for w in words if w)

    @staticmethod
    def to_snake_case(name: str) -> str:
        words = NameStandardizer._split_to_words(name)
        return "_".join(w.lower() for w in words if w)

    @staticmethod
    def to_directory_name(name: str) -> str:
        return NameStandardizer.to_kebab_case(name).strip("-")

    @staticmethod
    def to_file_name(name: str, suffix: str = "") -> str:
        base = NameStandardizer.to_pascal_case(name)
        if suffix:
            suffix_clean = re.sub(r"^[\-_]+", "", suffix)
            return f"{base}{NameStandardizer.to_pascal_case(suffix_clean)}"
        return base

    @staticmethod
    def to_component_name(name: str) -> str:
        return NameStandardizer.to_file_name(name, "Page")

    @staticmethod
    def to_hook_name(name: str, action_type: str = "Actions") -> str:
        return f"use{NameStandardizer.to_pascal_case(name)}{NameStandardizer.to_pascal_case(action_type)}"

    @staticmethod
    def to_constant_name(name: str) -> str:
        return NameStandardizer.to_snake_case(name).upper()

    @staticmethod
    def register_acronyms(acronyms: Iterable[str]) -> None:
        for a in acronyms:
            if a:
                NameStandardizer.ACRONYMS.add(a.upper())

    @staticmethod
    def register_domain_words(words: Iterable[str]) -> None:
        for w in words:
            if w:
                NameStandardizer.DOMAIN_WORDS.add(w.lower())

    @staticmethod
    def register_suffix_words(words: Iterable[str]) -> None:
        """Add custom suffixes (will be re-sorted by length desc)."""
        new = set(NameStandardizer.SUFFIX_WORDS)
        for w in words:
            if w:
                new.add(w.lower())
        NameStandardizer.SUFFIX_WORDS = sorted(new, key=len, reverse=True)
