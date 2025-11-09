#!/usr/bin/env python3
"""
Simple App Executor (Tkinter)
- Save profiles (name, command, args, cwd)
- Run / Stop, show live stdout/stderr
"""

import os
import json
import shlex
import threading
import queue
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

APP_DIR = os.path.expanduser("~/.app_executor")
PROFILES_FILE = os.path.join(APP_DIR, "profiles.json")
os.makedirs(APP_DIR, exist_ok=True)

def load_profiles():
    try:
        with open(PROFILES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_profiles(profiles):
    with open(PROFILES_FILE, "w", encoding='utf-8') as f:
        json.dump(profiles, f, indent=2)

class ExecutorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("App Executor")
        self.geometry("900x600")
        self.profiles = load_profiles()
        self.proc = None
        self.output_q = queue.Queue()

        self.create_widgets()
        self.refresh_profiles()
        self.after(100, self.flush_output_queue)

    def create_widgets(self):
        left = ttk.Frame(self, width=280)
        left.pack(side="left", fill="y", padx=6, pady=6)
        right = ttk.Frame(self)
        right.pack(side="right", expand=True, fill="both", padx=6, pady=6)

        # Profile list
        ttk.Label(left, text="Profiles").pack(anchor="w")
        self.listbox = tk.Listbox(left, height=20)
        self.listbox.pack(fill="y", expand=True)
        self.listbox.bind("<<ListboxSelect>>", lambda e: self.load_selected())

        btn_frame = ttk.Frame(left)
        btn_frame.pack(fill="x", pady=6)
        ttk.Button(btn_frame, text="New", command=self.new_profile).pack(side="left")
        ttk.Button(btn_frame, text="Delete", command=self.delete_profile).pack(side="left")

        # Profile editor
        frm = ttk.Frame(right)
        frm.pack(fill="x")
        ttk.Label(frm, text="Name").grid(row=0, column=0, sticky="w")
        self.name_e = ttk.Entry(frm)
        self.name_e.grid(row=0, column=1, sticky="ew", padx=4)
        ttk.Label(frm, text="Command / Path").grid(row=1, column=0, sticky="w")
        self.cmd_e = ttk.Entry(frm)
        self.cmd_e.grid(row=1, column=1, sticky="ew", padx=4)
        ttk.Button(frm, text="Browse", command=self.browse_cmd).grid(row=1, column=2)
        ttk.Label(frm, text="Args (space-separated)").grid(row=2, column=0, sticky="w")
        self.args_e = ttk.Entry(frm)
        self.args_e.grid(row=2, column=1, sticky="ew", padx=4)
        ttk.Label(frm, text="Working Dir").grid(row=3, column=0, sticky="w")
        self.cwd_e = ttk.Entry(frm)
        self.cwd_e.grid(row=3, column=1, sticky="ew", padx=4)
        ttk.Button(frm, text="Browse", command=self.browse_cwd).grid(row=3, column=2)
        frm.columnconfigure(1, weight=1)

        save_run_frame = ttk.Frame(right)
        save_run_frame.pack(fill="x", pady=6)
        ttk.Button(save_run_frame, text="Save", command=self.save_profile).pack(side="left")
        self.run_btn = ttk.Button(save_run_frame, text="Run", command=self.toggle_run)
        self.run_btn.pack(side="left", padx=6)
        ttk.Button(save_run_frame, text="Open Terminal", command=self.open_terminal).pack(side="left")

        # Output box
        ttk.Label(right, text="Output").pack(anchor="w")
        self.output_txt = tk.Text(right, wrap="none", height=20)
        self.output_txt.pack(fill="both", expand=True)
        self.output_txt.configure(state="disabled")

    def refresh_profiles(self):
        self.listbox.delete(0, "end")
        for p in self.profiles:
            self.listbox.insert("end", p.get("name", "<unnamed>"))

    def new_profile(self):
        self.name_e.delete(0, "end")
        self.cmd_e.delete(0, "end")
        self.args_e.delete(0, "end")
        self.cwd_e.delete(0, "end")

    def load_selected(self):
        sel = self.get_selected_profile()
        if sel is None:
            return
        self.name_e.delete(0, "end"); self.name_e.insert(0, sel.get("name",""))
        self.cmd_e.delete(0, "end"); self.cmd_e.insert(0, sel.get("cmd",""))
        self.args_e.delete(0, "end"); self.args_e.insert(0, " ".join(sel.get("args",[])))
        self.cwd_e.delete(0, "end"); self.cwd_e.insert(0, sel.get("cwd",""))

    def get_selected_profile(self):
        idxs = self.listbox.curselection()
        if not idxs:
            return None
        return self.profiles[idxs[0]]

    def save_profile(self):
        name = self.name_e.get().strip() or "Unnamed"
        cmd = self.cmd_e.get().strip()
        args = shlex.split(self.args_e.get().strip()) if self.args_e.get().strip() else []
        cwd = self.cwd_e.get().strip() or None
        sel = self.listbox.curselection()
        profile = {"name": name, "cmd": cmd, "args": args, "cwd": cwd}
        if sel:
            self.profiles[sel[0]] = profile
        else:
            self.profiles.append(profile)
        save_profiles(self.profiles)
        self.refresh_profiles()
        messagebox.showinfo("Saved", "Profile saved.")

    def delete_profile(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        if messagebox.askyesno("Delete", f"Delete {self.profiles[idx]['name']}?"):
            self.profiles.pop(idx)
            save_profiles(self.profiles)
            self.refresh_profiles()

    def browse_cmd(self):
        path = filedialog.askopenfilename(title="Select script or executable")
        if path:
            self.cmd_e.delete(0, "end")
            self.cmd_e.insert(0, path)

    def browse_cwd(self):
        d = filedialog.askdirectory(title="Select working directory")
        if d:
            self.cwd_e.delete(0, "end")
            self.cwd_e.insert(0, d)

    def toggle_run(self):
        if self.proc and self.proc.poll() is None:
            # running -> stop
            self.stop_process()
            return
        self.start_process()

    def start_process(self):
        sel = self.get_selected_profile()
        if sel is None:
            # build from editor
            cmd = self.cmd_e.get().strip()
            args = shlex.split(self.args_e.get().strip()) if self.args_e.get().strip() else []
            cwd = self.cwd_e.get().strip() or None
        else:
            cmd = sel.get("cmd")
            args = sel.get("args", [])
            cwd = sel.get("cwd") or None
        if not cmd:
            messagebox.showerror("Error", "No command set.")
            return

        # If it's a script path and not executable, run with the system python
        # Here we choose to run as: [cmd] + args; if cmd is a python file, run with sys.executable
        if cmd.endswith(".py"):
            python = os.environ.get("PYTHON_EXECUTABLE", None) or "python"
            full_cmd = [python, cmd] + args
        else:
            full_cmd = [cmd] + args

        try:
            self.proc = subprocess.Popen(
                full_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cwd,
                text=True,
                bufsize=1
            )
        except Exception as e:
            messagebox.showerror("Failed to start", str(e))
            self.proc = None
            return

        self.run_btn.config(text="Stop")
        self.append_output(f"Started: {' '.join(shlex.quote(p) for p in full_cmd)}\n\n")
        # start threads to read stdout/stderr
        threading.Thread(target=self.read_stream, args=(self.proc.stdout,)).start()
        threading.Thread(target=self.read_stream, args=(self.proc.stderr,)).start()
        threading.Thread(target=self.monitor_proc).start()

    def read_stream(self, stream):
        try:
            for line in iter(stream.readline, ""):
                if line:
                    self.output_q.put(line)
        finally:
            stream.close()

    def monitor_proc(self):
        self.proc.wait()
        self.output_q.put(f"\nProcess exited with code {self.proc.returncode}\n")
        self.run_btn.config(text="Run")
        self.proc = None

    def stop_process(self):
        if not self.proc:
            return
        self.proc.terminate()
        self.append_output("\nTerminated process.\n")
        self.run_btn.config(text="Run")

    def append_output(self, text):
        self.output_txt.configure(state="normal")
        self.output_txt.insert("end", text)
        self.output_txt.see("end")
        self.output_txt.configure(state="disabled")

    def flush_output_queue(self):
        try:
            while True:
                piece = self.output_q.get_nowait()
                self.append_output(piece)
        except queue.Empty:
            pass
        self.after(100, self.flush_output_queue)

    def open_terminal(self):
        sel = self.get_selected_profile()
        if sel is None:
            messagebox.showinfo("Open Terminal", "Select a profile first.")
            return
        cmd = sel.get("cmd")
        cwd = sel.get("cwd") or os.getcwd()
        if os.name == "nt":
            # Windows: open new cmd.exe window
            subprocess.Popen(["start", "cmd", "/K", cmd], shell=True, cwd=cwd)
        else:
            # macOS / Linux, open x-terminal-emulator or gnome-terminal if available
            term = shutil.which("x-terminal-emulator") or shutil.which("gnome-terminal") or shutil.which("konsole")
            if term:
                subprocess.Popen([term, "--", cmd], cwd=cwd)
            else:
                messagebox.showinfo("Terminal", f"Couldn't find a terminal to open. Run: {cmd} in {cwd}")

if __name__ == "__main__":
    try:
        app = ExecutorApp()
        app.mainloop()
    except Exception as e:
        print("Fatal error:", e)
