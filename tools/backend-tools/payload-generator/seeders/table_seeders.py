#!/usr/bin/env python3
"""
Table Seeders Module

Individual seeder classes for each database table.
Each seeder creates realistic, non-duplicate data for testing.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from .data_generators import DataGenerators
from .database_manager import DatabaseManager


class BaseSeeder:
    """Base class for all table seeders"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.generators = DataGenerators()
        
    def seed(self, count: int = 1) -> List[Any]:
        """Override in subclasses"""
        raise NotImplementedError("Subclasses must implement seed method")


class UsersSeeder(BaseSeeder):
    """Seeder for the users table"""
    
    def seed(self, count: int = 3) -> List[str]:
        """Create test users"""
        user_ids = []
        
        for _ in range(count):
            username = self.generators.generate_username()
            email = self.generators.generate_email(username)
            
            user_data = {
                'id': self.generators.generate_uuid(),
                'username': username,
                'email': email,
                'password_hash': '$2b$10$example.hash.for.testing.purposes.only',
                'chess_elo': self.generators.generate_chess_elo(),
                'puzzle_rating': self.generators.generate_puzzle_rating(),
                'preferences': json.dumps(self.generators.generate_user_preferences()),
                'created_at': self.generators.generate_random_timestamp(30),
                'updated_at': datetime.now()
            }
            
            user_id = self.db.insert_record('users', user_data, "UPDATE")
            if user_id:
                user_ids.append(user_id)
        
        return user_ids


class UserProfilesSeeder(BaseSeeder):
    """Seeder for user_profiles table"""
    
    def seed(self, user_ids: List[str], count: int = None) -> List[str]:
        """Create user profiles for given user IDs"""
        if not user_ids:
            return []
            
        profile_ids = []
        users_to_process = user_ids[:count] if count else user_ids
        
        for user_id in users_to_process:
            profile_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'display_name': self.generators.generate_player_name(),
                'avatar_url': f"https://example.com/avatars/{self.generators.generate_nanoid(8)}.jpg",
                'bio': f"Chess enthusiast since {2020 - abs(hash(user_id)) % 10}",
                'country': self.generators.fake.country_code(),
                'timezone': self.generators.fake.timezone(),
                'created_at': self.generators.generate_random_timestamp(30),
                'updated_at': datetime.now()
            }
            
            profile_id = self.db.insert_record('user_profiles', profile_data, "UPDATE")
            if profile_id:
                profile_ids.append(profile_id)
        
        return profile_ids


class UserSessionsSeeder(BaseSeeder):
    """Seeder for user_sessions table"""
    
    def seed(self, user_ids: List[str], count: int = None) -> List[str]:
        """Create user sessions"""
        if not user_ids:
            return []
            
        session_ids = []
        users_to_process = user_ids[:count] if count else user_ids
        
        for user_id in users_to_process:
            session_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'refresh_token': self.generators.generate_nanoid(64),
                'expires_at': self.generators.generate_random_timestamp(-30),  # Future date
                'created_at': self.generators.generate_random_timestamp(7),
                'updated_at': datetime.now()
            }
            
            session_id = self.db.insert_record('user_sessions', session_data, "UPDATE")
            if session_id:
                session_ids.append(session_id)
        
        return session_ids


class GamesSeeder(BaseSeeder):
    """Seeder for games table"""
    
    def seed(self, user_ids: List[str], count: int = 5) -> List[str]:
        """Create game records"""
        if not user_ids:
            return []
            
        game_ids = []
        
        for _ in range(count):
            user_id = self.generators.fake.random_element(user_ids)
            
            game_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'ai_level': self.generators.fake.random_int(1, 10),
                'user_color': self.generators.fake.random_element(['white', 'black']),
                'current_fen': self.generators.generate_chess_fen(),
                'pgn': self.generators.generate_chess_pgn(),
                'status': self.generators.generate_game_status(),
                'result': self.generators.generate_game_result() if self.generators.fake.boolean(70) else None,
                'time_control': self.generators.fake.random_element(['blitz', 'rapid', 'classical', 'bullet']),
                'started_at': self.generators.generate_random_timestamp(30),
                'completed_at': self.generators.generate_random_timestamp(15) if self.generators.fake.boolean(60) else None,
                'created_at': self.generators.generate_random_timestamp(30),
                'updated_at': datetime.now()
            }
            
            game_id = self.db.insert_record('games', game_data, "UPDATE")
            if game_id:
                game_ids.append(game_id)
        
        return game_ids


class HistoricGamesSeeder(BaseSeeder):
    """Seeder for historic_games table"""
    
    def seed(self, count: int = 3) -> List[str]:
        """Create historic game records"""
        game_ids = []
        
        for _ in range(count):
            game_data = {
                'id': self.generators.generate_uuid(),
                'white_player': self.generators.generate_player_name(),
                'black_player': self.generators.generate_player_name(),
                'white_rating': self.generators.generate_chess_elo(),
                'black_rating': self.generators.generate_chess_elo(),
                'tournament_name': self.generators.generate_tournament_name(),
                'tournament_year': self.generators.fake.random_int(1980, 2024),
                'opening_name': self.generators.generate_opening_name(),
                'opening_eco': self.generators.generate_eco_code(),
                'result': self.generators.generate_game_result(),
                'pgn': self.generators.generate_chess_pgn(),
                'created_at': self.generators.generate_random_timestamp(365),
                'updated_at': datetime.now()
            }
            
            game_id = self.db.insert_record('historic_games', game_data, "UPDATE")
            if game_id:
                game_ids.append(game_id)
        
        return game_ids


class OpeningsSeeder(BaseSeeder):
    """Seeder for openings table"""
    
    def seed(self, count: int = 4) -> List[str]:
        """Create opening records"""
        opening_ids = []
        
        for _ in range(count):
            opening_data = {
                'id': self.generators.generate_uuid(),
                'name': self.generators.generate_opening_name(),
                'eco_code': self.generators.generate_eco_code(),
                'moves': self.generators.generate_chess_pgn(),
                'description': self.generators.fake.paragraph(nb_sentences=2),
                'popularity_score': self.generators.fake.random_int(1, 100),
                'difficulty_level': self.generators.generate_difficulty_level(),
                'created_at': self.generators.generate_random_timestamp(180),
                'updated_at': datetime.now()
            }
            
            opening_id = self.db.insert_record('openings', opening_data, "UPDATE")
            if opening_id:
                opening_ids.append(opening_id)
        
        return opening_ids


class PuzzlesSeeder(BaseSeeder):
    """Seeder for puzzles table"""
    
    def seed(self, count: int = 6) -> List[str]:
        """Create puzzle records"""
        puzzle_ids = []
        
        for _ in range(count):
            puzzle_data = {
                'id': self.generators.generate_uuid(),
                'fen': self.generators.generate_chess_fen(),
                'solution_moves': self.generators.fake.random_element([
                    'Qd8+ Kf7 Qd5+',
                    'Nf7+ Kg8 Nxd8',
                    'Bxf7+ Kh8 Bg6',
                    'Rxe8+ Rxe8 Qxd7'
                ]),
                'themes': json.dumps(self.generators.generate_chess_themes()),
                'rating': self.generators.generate_puzzle_rating(),
                'description': self.generators.fake.sentence(),
                'created_at': self.generators.generate_random_timestamp(90),
                'updated_at': datetime.now()
            }
            
            puzzle_id = self.db.insert_record('puzzles', puzzle_data, "UPDATE")
            if puzzle_id:
                puzzle_ids.append(puzzle_id)
        
        return puzzle_ids


class PuzzleSourcesSeeder(BaseSeeder):
    """Seeder for puzzle_sources table"""
    
    def seed(self, count: int = 2) -> List[str]:
        """Create puzzle source records"""
        source_ids = []
        
        sources = [
            {'name': 'Lichess Database', 'url': 'https://database.lichess.org'},
            {'name': 'Chess.com Puzzles', 'url': 'https://chess.com/puzzles'},
            {'name': 'ChessTempo', 'url': 'https://chesstempo.com'},
            {'name': 'Chess King Training', 'url': 'https://chessking.com'}
        ]
        
        for i in range(min(count, len(sources))):
            source = sources[i]
            source_data = {
                'id': self.generators.generate_uuid(),
                'source_id': f"src_{self.generators.generate_nanoid(8)}",
                'name': source['name'],
                'description': f"High-quality chess puzzles from {source['name']}",
                'total_puzzles': self.generators.fake.random_int(1000, 50000),
                'average_rating': self.generators.fake.random_int(1200, 2000),
                'is_active': True,
                'attribution': f"Puzzles courtesy of {source['name']}",
                'license': self.generators.fake.random_element(['Creative Commons', 'Public Domain', 'Licensed']),
                'url': source['url'],
                'created_at': self.generators.generate_random_timestamp(365),
                'updated_at': datetime.now()
            }
            
            source_id = self.db.insert_record('puzzle_sources', source_data, "UPDATE")
            if source_id:
                source_ids.append(source_id)
        
        return source_ids


class PuzzleAttemptsSeeder(BaseSeeder):
    """Seeder for puzzle_attempts table"""
    
    def seed(self, user_ids: List[str], puzzle_ids: List[str], count: int = 8) -> List[str]:
        """Create puzzle attempt records"""
        if not user_ids or not puzzle_ids:
            return []
            
        attempt_ids = []
        
        for _ in range(count):
            user_id = self.generators.fake.random_element(user_ids)
            puzzle_id = self.generators.fake.random_element(puzzle_ids)
            is_correct = self.generators.fake.boolean(70)
            
            attempt_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'puzzle_id': puzzle_id,
                'moves': self.generators.fake.random_element(['Qd8+', 'Nf7+', 'Bxf7+', 'Rxe8+']),
                'correct': is_correct,
                'time_taken': self.generators.fake.random_int(5, 300),  # 5 seconds to 5 minutes
                'hints_used': self.generators.fake.random_int(0, 3) if not is_correct else 0,
                'rating_change': self.generators.fake.random_int(-20, 15) if is_correct else self.generators.fake.random_int(-15, 5),
                'attempted_at': self.generators.generate_random_timestamp(30),
                'created_at': self.generators.generate_random_timestamp(30),
                'updated_at': datetime.now()
            }
            
            attempt_id = self.db.insert_record('puzzle_attempts', attempt_data, "UPDATE")
            if attempt_id:
                attempt_ids.append(attempt_id)
        
        return attempt_ids


class AchievementsSeeder(BaseSeeder):
    """Seeder for achievements table"""
    
    def seed(self, count: int = 4) -> List[str]:
        """Create achievement records"""
        achievement_ids = []
        
        achievements = [
            {'name': 'First Victory', 'description': 'Win your first game', 'category': 'beginner', 'points': 10},
            {'name': 'Puzzle Master', 'description': 'Solve 100 puzzles', 'category': 'puzzles', 'points': 50},
            {'name': 'Speed Demon', 'description': 'Win 10 bullet games', 'category': 'time_control', 'points': 25},
            {'name': 'Tactical Genius', 'description': 'Solve 50 tactical puzzles in a row', 'category': 'tactics', 'points': 75},
        ]
        
        for i in range(min(count, len(achievements))):
            ach = achievements[i]
            achievement_data = {
                'id': self.generators.generate_nanoid(17),  # Match pattern in schema
                'name': ach['name'],
                'description': ach['description'],
                'category': ach['category'],
                'icon': self.generators.fake.random_element(['trophy', 'star', 'medal', 'crown']),
                'points': ach['points'],
                'difficulty': self.generators.generate_difficulty_level(),
                'requirements': json.dumps({'type': 'count', 'target': self.generators.fake.random_int(1, 100)}),
                'created_at': self.generators.generate_random_timestamp(365),
                'updated_at': datetime.now()
            }
            
            achievement_id = self.db.insert_record('achievements', achievement_data, "UPDATE")
            if achievement_id:
                achievement_ids.append(achievement_id)
        
        return achievement_ids


class UserAchievementsSeeder(BaseSeeder):
    """Seeder for user_achievements table"""
    
    def seed(self, user_ids: List[str], achievement_ids: List[str], count: int = 6) -> List[str]:
        """Create user achievement records"""
        if not user_ids or not achievement_ids:
            return []
            
        user_achievement_ids = []
        
        for _ in range(count):
            user_id = self.generators.fake.random_element(user_ids)
            achievement_id = self.generators.fake.random_element(achievement_ids)
            
            user_achievement_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'achievement_id': achievement_id,
                'earned_at': self.generators.generate_random_timestamp(60),
                'progress': round(self.generators.fake.random.uniform(0.5, 1.0), 2),
                'created_at': self.generators.generate_random_timestamp(60),
                'updated_at': datetime.now()
            }
            
            user_achievement_id = self.db.insert_record('user_achievements', user_achievement_data, "ON CONFLICT (user_id, achievement_id) DO UPDATE SET progress = EXCLUDED.progress")
            if user_achievement_id:
                user_achievement_ids.append(user_achievement_id)
        
        return user_achievement_ids


class ContentSeeder(BaseSeeder):
    """Seeder for content table"""
    
    def seed(self, count: int = 4) -> List[str]:
        """Create learning content records"""
        content_ids = []
        
        for _ in range(count):
            content_data = {
                'id': self.generators.generate_uuid(),
                'title': self.generators.generate_content_title(),
                'content_type': self.generators.fake.random_element(['tutorial', 'lesson', 'course', 'exercise']),
                'parent_id': None,  # Top-level content
                'order_index': self.generators.fake.random_int(1, 20),
                'description': self.generators.fake.paragraph(nb_sentences=2),
                'content_body': json.dumps(self.generators.generate_content_body()),
                'difficulty_level': self.generators.generate_difficulty_level(),
                'estimated_duration': self.generators.fake.random_int(10, 60),  # minutes
                'category': self.generators.fake.random_element(['opening', 'middlegame', 'endgame', 'tactics']),
                'objectives': json.dumps([self.generators.fake.sentence() for _ in range(2)]),
                'prerequisites': json.dumps([]) if self.generators.fake.boolean(70) else json.dumps([self.generators.fake.sentence()]),
                'is_published': self.generators.fake.boolean(80),
                'version': self.generators.fake.random_int(1, 3),
                'created_at': self.generators.generate_random_timestamp(180),
                'updated_at': datetime.now()
            }
            
            content_id = self.db.insert_record('content', content_data, "UPDATE")
            if content_id:
                content_ids.append(content_id)
        
        return content_ids


class UserContentProgressSeeder(BaseSeeder):
    """Seeder for user_content_progress table"""
    
    def seed(self, user_ids: List[str], content_ids: List[str], count: int = 6) -> List[str]:
        """Create user content progress records"""
        if not user_ids or not content_ids:
            return []
            
        progress_ids = []
        
        for _ in range(count):
            user_id = self.generators.fake.random_element(user_ids)
            content_id = self.generators.fake.random_element(content_ids)
            status = self.generators.fake.random_element(['not_started', 'in_progress', 'completed'])
            
            # Generate consistent timestamps
            created_at = self.generators.generate_random_timestamp(30)
            started_at = None
            completed_at = None
            
            if status != 'not_started':
                started_at = self.generators.generate_random_timestamp(25)  # More recent than created
                if status == 'completed':
                    # Completed date should be after started date
                    hours_after_start = self.generators.fake.random_int(1, 240)  # 1 hour to 10 days after start
                    completed_at = started_at + timedelta(hours=hours_after_start)
            
            progress_data = {
                'id': self.generators.generate_uuid(),
                'user_id': user_id,
                'content_id': content_id,
                'status': status,
                'progress_percentage': round(self.generators.fake.random.uniform(0.0, 100.0), 2),
                'time_spent': self.generators.fake.random_int(0, 3600),  # seconds
                'completion_score': round(self.generators.fake.random.uniform(0.6, 1.0), 2) if status == 'completed' else None,
                'started_at': started_at,
                'completed_at': completed_at,
                'last_accessed': self.generators.generate_random_timestamp(7),
                'notes': self.generators.fake.paragraph(nb_sentences=1) if self.generators.fake.boolean(30) else None,
                'bookmarked': self.generators.fake.boolean(20),
                'created_at': created_at,
                'updated_at': datetime.now()
            }
            
            progress_id = self.db.insert_record('user_content_progress', progress_data, "ON CONFLICT (user_id, content_id) DO UPDATE SET progress_percentage = EXCLUDED.progress_percentage")
            if progress_id:
                progress_ids.append(progress_id)
        
        return progress_ids