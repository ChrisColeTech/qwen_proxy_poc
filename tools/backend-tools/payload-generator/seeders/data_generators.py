#!/usr/bin/env python3
"""
Data Generators Module

Reusable data generation utilities for creating realistic test data.
Each function generates fresh, randomized data to avoid duplicates.
"""

import random
import string
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from faker import Faker

fake = Faker()


class DataGenerators:
    """Collection of data generation methods for various data types"""
    
    def __init__(self):
        """Initialize with a faker instance"""
        self.fake = Faker()
    
    @staticmethod
    def generate_uuid() -> str:
        """Generate a fresh UUID"""
        return str(uuid.uuid4())
    
    @staticmethod
    def generate_nanoid(length: int = 12) -> str:
        """Generate a nanoid-style string"""
        chars = string.ascii_letters + string.digits
        return ''.join(random.choices(chars, k=length))
    
    @staticmethod
    def generate_username() -> str:
        """Generate a unique username"""
        timestamp = datetime.now().strftime('%m%d%H%M%S%f')[:14]  # Include microseconds
        adjective = random.choice(['swift', 'clever', 'bold', 'wise', 'brave', 'quick', 'sharp', 'bright', 'strong'])
        noun = random.choice(['knight', 'bishop', 'rook', 'queen', 'king', 'pawn', 'master', 'player', 'champion'])
        random_suffix = random.randint(100, 999)
        return f"{adjective}_{noun}_{timestamp}_{random_suffix}"
    
    @staticmethod
    def generate_email(username: str = None) -> str:
        """Generate a unique email address"""
        if not username:
            username = DataGenerators.generate_username()
        domain = random.choice(['example.com', 'test.com', 'demo.org'])
        return f"{username}@{domain}"
    
    @staticmethod
    def generate_chess_elo() -> int:
        """Generate a realistic chess ELO rating"""
        return random.randint(800, 2400)
    
    @staticmethod
    def generate_puzzle_rating() -> int:
        """Generate a realistic puzzle rating"""
        return random.randint(1000, 2800)
    
    @staticmethod
    def generate_chess_fen() -> str:
        """Generate various chess FEN positions"""
        positions = [
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  # Starting position
            "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3",  # Italian game
            "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2",  # After 1.e4 Nf6
            "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3",  # Spanish game
            "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 4",  # Italian vs Two Knights
        ]
        return random.choice(positions)
    
    @staticmethod
    def generate_chess_pgn() -> str:
        """Generate realistic chess PGN moves"""
        openings = [
            "1. e4 e5 2. Nf3 Nc6 3. Bb5",  # Spanish Opening
            "1. d4 d5 2. c4 e6 3. Nc3",     # Queen's Gambit
            "1. e4 c5 2. Nf3 d6 3. d4",     # Sicilian Defense
            "1. Nf3 Nf6 2. c4 g6 3. Nc3",   # English Opening
            "1. e4 e6 2. d4 d5 3. Nc3",     # French Defense
        ]
        return random.choice(openings)
    
    @staticmethod
    def generate_chess_themes() -> List[str]:
        """Generate chess puzzle themes as a list"""
        theme_options = [
            ["tactics", "fork"],
            ["endgame", "checkmate"],
            ["opening", "development"],
            ["middlegame", "pin"],
            ["tactics", "skewer"],
            ["endgame", "pawnEndgame"],
            ["tactics", "discoveredAttack"],
            ["middlegame", "sacrifice"],
        ]
        return random.choice(theme_options)
    
    @staticmethod
    def generate_player_name() -> str:
        """Generate a chess player name"""
        first_names = ['Magnus', 'Garry', 'Bobby', 'Anatoly', 'Vladimir', 'Fabiano', 'Hikaru', 'Ding']
        last_names = ['Carlsen', 'Kasparov', 'Fischer', 'Karpov', 'Kramnik', 'Caruana', 'Nakamura', 'Liren']
        return f"{random.choice(first_names)} {random.choice(last_names)}"
    
    @staticmethod
    def generate_tournament_name() -> str:
        """Generate tournament names"""
        tournaments = [
            "World Championship 2024",
            "Candidates Tournament",
            "Grand Prix Series",
            "Chess Olympiad",
            "Sinquefield Cup",
            "Norway Chess",
            "Tata Steel Masters",
            "Grand Swiss Tournament"
        ]
        return random.choice(tournaments)
    
    @staticmethod
    def generate_opening_name() -> str:
        """Generate chess opening names"""
        openings = [
            "Ruy Lopez",
            "Sicilian Defense",
            "French Defense",
            "Queen's Gambit",
            "King's Indian Defense",
            "English Opening",
            "Caro-Kann Defense",
            "Italian Game",
            "Nimzo-Indian Defense",
            "Catalan Opening"
        ]
        return random.choice(openings)
    
    @staticmethod
    def generate_eco_code() -> str:
        """Generate ECO (Encyclopedia of Chess Openings) codes"""
        letter = random.choice(['A', 'B', 'C', 'D', 'E'])
        number = random.randint(10, 99)
        return f"{letter}{number}"
    
    @staticmethod
    def generate_achievement_name() -> str:
        """Generate achievement names"""
        achievements = [
            "First Victory",
            "Puzzle Master",
            "Speed Demon",
            "Tactical Genius",
            "Endgame Expert",
            "Opening Scholar",
            "Comeback King",
            "Perfect Score",
            "Marathon Player",
            "Strategic Mind"
        ]
        return random.choice(achievements)
    
    @staticmethod
    def generate_content_title() -> str:
        """Generate learning content titles"""
        topics = [
            "Opening Principles",
            "Tactical Patterns",
            "Endgame Fundamentals",
            "Positional Understanding",
            "Pawn Structures",
            "King Safety",
            "Piece Coordination",
            "Time Management",
            "Calculation Techniques",
            "Strategic Planning"
        ]
        return random.choice(topics)
    
    @staticmethod
    def generate_random_timestamp(days_back: int = 30) -> datetime:
        """Generate a random timestamp within the last N days (or future if negative)"""
        now = datetime.now()
        
        if days_back < 0:
            # Future date
            days_forward = abs(days_back)
            random_days = random.randint(1, days_forward)
            random_hours = random.randint(0, 23)
            random_minutes = random.randint(0, 59)
            return now + timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
        else:
            # Past date
            random_days = random.randint(0, days_back) if days_back > 0 else 0
            random_hours = random.randint(0, 23)
            random_minutes = random.randint(0, 59)
            return now - timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
    
    @staticmethod
    def generate_game_result() -> str:
        """Generate chess game results"""
        return random.choice(['1-0', '0-1', '1/2-1/2'])
    
    @staticmethod
    def generate_difficulty_level() -> str:
        """Generate difficulty levels"""
        return random.choice(['beginner', 'intermediate', 'advanced'])
    
    @staticmethod
    def generate_game_status() -> str:
        """Generate game status"""
        return random.choice(['active', 'completed', 'abandoned', 'paused'])
    
    @staticmethod
    def generate_user_preferences() -> Dict[str, Any]:
        """Generate user preferences as JSON"""
        return {
            "theme": random.choice(["light", "dark", "auto"]),
            "board_style": random.choice(["classic", "modern", "wooden"]),
            "piece_set": random.choice(["classic", "modern", "fantasy"]),
            "sound_effects": random.choice([True, False]),
            "auto_queen": random.choice([True, False]),
            "show_coordinates": random.choice([True, False])
        }
    
    @staticmethod
    def generate_content_body() -> Dict[str, Any]:
        """Generate learning content body as JSON"""
        return {
            "sections": [
                {
                    "title": "Introduction",
                    "content": fake.paragraph(nb_sentences=3),
                    "type": "text"
                },
                {
                    "title": "Key Concepts",
                    "content": [fake.sentence() for _ in range(3)],
                    "type": "list"
                },
                {
                    "title": "Practice",
                    "content": fake.paragraph(nb_sentences=2),
                    "type": "text"
                }
            ],
            "duration_minutes": random.randint(5, 45),
            "difficulty": DataGenerators.generate_difficulty_level()
        }