#!/usr/bin/env python3
"""
Test Data Seeder V2

Modular test data seeder that creates fresh, realistic test data for all database tables.
Uses reusable components to avoid duplicates and generate diverse data each run.

This module creates all the test data that the payload generator needs
and updates the real_test_ids.json file with the actual database IDs.
"""

import json
import os
from typing import Dict, List, Any, Optional

# Import our modular seeding components
try:
    from seeders import (
        DatabaseManager,
        UsersSeeder,
        UserProfilesSeeder,
        UserSessionsSeeder,
        GamesSeeder,
        HistoricGamesSeeder,
        OpeningsSeeder,
        PuzzlesSeeder,
        PuzzleSourcesSeeder,
        PuzzleAttemptsSeeder,
        AchievementsSeeder,
        UserAchievementsSeeder,
        ContentSeeder,
        UserContentProgressSeeder
    )
except ImportError as e:
    print(f"❌ Failed to import seeder modules: {e}")
    print("💡 Make sure you have installed the required dependencies: pip install faker psycopg2-binary")
    exit(1)


class TestDataSeederV2:
    """
    Orchestrates the seeding process using modular components.
    Each run generates fresh, unique test data.
    """
    
    def __init__(self, cleanup_old_data: bool = True):
        """Initialize the test data seeder with modular components."""
        self.db_manager = DatabaseManager()
        self.real_ids = {}
        self.cleanup_old_data = cleanup_old_data
        
        # Initialize all seeders
        self.users_seeder = UsersSeeder(self.db_manager)
        self.user_profiles_seeder = UserProfilesSeeder(self.db_manager)
        self.user_sessions_seeder = UserSessionsSeeder(self.db_manager)
        self.games_seeder = GamesSeeder(self.db_manager)
        self.historic_games_seeder = HistoricGamesSeeder(self.db_manager)
        self.openings_seeder = OpeningsSeeder(self.db_manager)
        self.puzzles_seeder = PuzzlesSeeder(self.db_manager)
        self.puzzle_sources_seeder = PuzzleSourcesSeeder(self.db_manager)
        self.puzzle_attempts_seeder = PuzzleAttemptsSeeder(self.db_manager)
        self.achievements_seeder = AchievementsSeeder(self.db_manager)
        self.user_achievements_seeder = UserAchievementsSeeder(self.db_manager)
        self.content_seeder = ContentSeeder(self.db_manager)
        self.user_content_progress_seeder = UserContentProgressSeeder(self.db_manager)
    
    def seed_all_test_data(self) -> bool:
        """
        Create comprehensive test data for all database tables.
        Returns True if successful, False otherwise.
        """
        print("🚀 Starting comprehensive test data seeding...")
        print("📊 This will generate fresh, unique data for all tables")
        
        try:
            # Optional cleanup of old test data
            if self.cleanup_old_data:
                print("🧹 Cleaning up old test data...")
                self.db_manager.cleanup_test_records()
            
            # Seed core entities first (these are dependencies for others)
            user_ids = self._seed_users()
            puzzle_ids = self._seed_puzzles()
            achievement_ids = self._seed_achievements()
            content_ids = self._seed_content()
            
            # Seed dependent entities (require core entities)
            self._seed_user_profiles(user_ids)
            self._seed_user_sessions(user_ids)
            self._seed_games(user_ids)
            self._seed_historic_games()
            self._seed_openings()
            self._seed_puzzle_sources()
            self._seed_puzzle_attempts(user_ids, puzzle_ids)
            self._seed_user_achievements(user_ids, achievement_ids)
            self._seed_user_content_progress(user_ids, content_ids)
            
            # Generate the real_test_ids.json file
            self._generate_real_ids_file()
            
            # Print summary
            self._print_seeding_summary()
            
            print("✅ Test data seeding completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Test data seeding failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _seed_users(self) -> List[str]:
        """Seed users table and return user IDs"""
        print("\n👥 Seeding users...")
        if not self.db_manager.table_exists('users'):
            print("⚠️  Users table not found, skipping")
            return []
        
        user_ids = self.users_seeder.seed(count=5)
        self.real_ids['user_ids'] = user_ids
        self.real_ids['user_id'] = user_ids[0] if user_ids else None
        return user_ids
    
    def _seed_user_profiles(self, user_ids: List[str]):
        """Seed user profiles for existing users"""
        print("\n📝 Seeding user profiles...")
        if not self.db_manager.table_exists('user_profiles') or not user_ids:
            print("⚠️  User profiles table not found or no users, skipping")
            return
        
        profile_ids = self.user_profiles_seeder.seed(user_ids, count=3)
        self.real_ids['profile_ids'] = profile_ids
        self.real_ids['profile_id'] = profile_ids[0] if profile_ids else None
    
    def _seed_user_sessions(self, user_ids: List[str]):
        """Seed user sessions"""
        print("\n🔐 Seeding user sessions...")
        if not self.db_manager.table_exists('user_sessions') or not user_ids:
            print("⚠️  User sessions table not found or no users, skipping")
            return
        
        session_ids = self.user_sessions_seeder.seed(user_ids, count=3)
        self.real_ids['session_ids'] = session_ids
        self.real_ids['session_id'] = session_ids[0] if session_ids else None
    
    def _seed_games(self, user_ids: List[str]):
        """Seed games table"""
        print("\n♔ Seeding games...")
        if not self.db_manager.table_exists('games') or not user_ids:
            print("⚠️  Games table not found or no users, skipping")
            return
        
        game_ids = self.games_seeder.seed(user_ids, count=8)
        self.real_ids['game_ids'] = game_ids
        self.real_ids['game_id'] = game_ids[0] if game_ids else None
    
    def _seed_historic_games(self):
        """Seed historic games table"""
        print("\n🏛️ Seeding historic games...")
        if not self.db_manager.table_exists('historic_games'):
            print("⚠️  Historic games table not found, skipping")
            return
        
        historic_game_ids = self.historic_games_seeder.seed(count=4)
        self.real_ids['historic_game_ids'] = historic_game_ids
        self.real_ids['historic_game_id'] = historic_game_ids[0] if historic_game_ids else None
    
    def _seed_openings(self):
        """Seed openings table"""
        print("\n📚 Seeding openings...")
        if not self.db_manager.table_exists('openings'):
            print("⚠️  Openings table not found, skipping")
            return
        
        opening_ids = self.openings_seeder.seed(count=5)
        self.real_ids['opening_ids'] = opening_ids
        self.real_ids['opening_id'] = opening_ids[0] if opening_ids else None
    
    def _seed_puzzles(self) -> List[str]:
        """Seed puzzles table and return puzzle IDs"""
        print("\n🧩 Seeding puzzles...")
        if not self.db_manager.table_exists('puzzles'):
            print("⚠️  Puzzles table not found, skipping")
            return []
        
        puzzle_ids = self.puzzles_seeder.seed(count=10)
        self.real_ids['puzzle_ids'] = puzzle_ids
        self.real_ids['puzzle_id'] = puzzle_ids[0] if puzzle_ids else None
        return puzzle_ids
    
    def _seed_puzzle_sources(self):
        """Seed puzzle sources table"""
        print("\n🔍 Seeding puzzle sources...")
        if not self.db_manager.table_exists('puzzle_sources'):
            print("⚠️  Puzzle sources table not found, skipping")
            return
        
        source_ids = self.puzzle_sources_seeder.seed(count=3)
        self.real_ids['puzzle_source_ids'] = source_ids
        self.real_ids['puzzle_source_id'] = source_ids[0] if source_ids else None
    
    def _seed_puzzle_attempts(self, user_ids: List[str], puzzle_ids: List[str]):
        """Seed puzzle attempts table"""
        print("\n🎯 Seeding puzzle attempts...")
        if not self.db_manager.table_exists('puzzle_attempts') or not user_ids or not puzzle_ids:
            print("⚠️  Puzzle attempts table not found or missing dependencies, skipping")
            return
        
        attempt_ids = self.puzzle_attempts_seeder.seed(user_ids, puzzle_ids, count=15)
        self.real_ids['puzzle_attempt_ids'] = attempt_ids
        self.real_ids['puzzle_attempt_id'] = attempt_ids[0] if attempt_ids else None
    
    def _seed_achievements(self) -> List[str]:
        """Seed achievements table and return achievement IDs"""
        print("\n🏆 Seeding achievements...")
        if not self.db_manager.table_exists('achievements'):
            print("⚠️  Achievements table not found, skipping")
            return []
        
        achievement_ids = self.achievements_seeder.seed(count=6)
        self.real_ids['achievement_ids'] = achievement_ids
        self.real_ids['achievement_id'] = achievement_ids[0] if achievement_ids else None
        return achievement_ids
    
    def _seed_user_achievements(self, user_ids: List[str], achievement_ids: List[str]):
        """Seed user achievements table"""
        print("\n🎖️ Seeding user achievements...")
        if not self.db_manager.table_exists('user_achievements') or not user_ids or not achievement_ids:
            print("⚠️  User achievements table not found or missing dependencies, skipping")
            return
        
        user_achievement_ids = self.user_achievements_seeder.seed(user_ids, achievement_ids, count=10)
        self.real_ids['user_achievement_ids'] = user_achievement_ids
        self.real_ids['user_achievement_id'] = user_achievement_ids[0] if user_achievement_ids else None
    
    def _seed_content(self) -> List[str]:
        """Seed content table and return content IDs"""
        print("\n📖 Seeding learning content...")
        if not self.db_manager.table_exists('content'):
            print("⚠️  Content table not found, skipping")
            return []
        
        content_ids = self.content_seeder.seed(count=6)
        self.real_ids['content_ids'] = content_ids
        self.real_ids['content_id'] = content_ids[0] if content_ids else None
        return content_ids
    
    def _seed_user_content_progress(self, user_ids: List[str], content_ids: List[str]):
        """Seed user content progress table"""
        print("\n📈 Seeding user content progress...")
        if not self.db_manager.table_exists('user_content_progress') or not user_ids or not content_ids:
            print("⚠️  User content progress table not found or missing dependencies, skipping")
            return
        
        progress_ids = self.user_content_progress_seeder.seed(user_ids, content_ids, count=12)
        self.real_ids['progress_ids'] = progress_ids
        self.real_ids['progress_id'] = progress_ids[0] if progress_ids else None
    
    def _generate_real_ids_file(self):
        """Generate the real_test_ids.json file with all created IDs"""
        real_ids_path = os.path.join(os.path.dirname(__file__), 'real_test_ids.json')
        
        # Import and use database ID fetcher to get existing IDs
        try:
            from db_id_fetcher import DatabaseIDFetcher
            
            print("\n🔄 Overriding seeded IDs with existing database IDs...")
            db_fetcher = DatabaseIDFetcher()
            existing_ids = db_fetcher.get_all_existing_ids()
            db_fetcher.close()
            
            # Use existing database IDs instead of seeded IDs to ensure they actually exist
            all_ids = existing_ids
            print("✅ Successfully overrode seeded IDs with existing database IDs")
            
        except Exception as e:
            print(f"⚠️  Failed to fetch existing database IDs: {e}")
            print("🔄 Falling back to seeded IDs...")
            
            # Add some legacy/compatibility IDs for backward compatibility
            legacy_ids = {
                'tutorial_id': 'legacy-tutorial-001',
                'learning_path_id': 'legacy-path-001',
                'ai_opponent_id': 'legacy-ai-001',
                'subscription_id': 'legacy-sub-001',
                'opening_eco_code': 'B92',
                'learning_module_id': 'legacy-module-001',
                'study_plan_id': 'legacy-plan-001',
                'enrollment_id': 'legacy-enrollment-001'
            }
            
            # Combine real IDs with legacy IDs
            all_ids = {**self.real_ids, **legacy_ids}
        
        try:
            with open(real_ids_path, 'w') as f:
                json.dump(all_ids, f, indent=2, default=str)
            print(f"\n✅ Updated real_test_ids.json with {len(all_ids)} IDs")
        except Exception as e:
            print(f"❌ Failed to update real_test_ids.json: {e}")
            raise
    
    def _print_seeding_summary(self):
        """Print a summary of what was seeded"""
        print("\n📊 SEEDING SUMMARY")
        print("=" * 50)
        
        summary_items = [
            ('Users', len(self.real_ids.get('user_ids', []))),
            ('User Profiles', len(self.real_ids.get('profile_ids', []))),
            ('User Sessions', len(self.real_ids.get('session_ids', []))),
            ('Games', len(self.real_ids.get('game_ids', []))),
            ('Historic Games', len(self.real_ids.get('historic_game_ids', []))),
            ('Openings', len(self.real_ids.get('opening_ids', []))),
            ('Puzzles', len(self.real_ids.get('puzzle_ids', []))),
            ('Puzzle Sources', len(self.real_ids.get('puzzle_source_ids', []))),
            ('Puzzle Attempts', len(self.real_ids.get('puzzle_attempt_ids', []))),
            ('Achievements', len(self.real_ids.get('achievement_ids', []))),
            ('User Achievements', len(self.real_ids.get('user_achievement_ids', []))),
            ('Learning Content', len(self.real_ids.get('content_ids', []))),
            ('Content Progress', len(self.real_ids.get('progress_ids', [])))
        ]
        
        for item_name, count in summary_items:
            status = "✅" if count > 0 else "⚠️"
            print(f"{status} {item_name:<20}: {count:>3} records")
        
        total_records = sum(count for _, count in summary_items)
        print(f"\n🎯 Total Records Created: {total_records}")


def main():
    """Main entry point for test data seeding"""
    try:
        # Create seeder with cleanup disabled for now (foreign key constraints)
        seeder = TestDataSeederV2(cleanup_old_data=False)
        success = seeder.seed_all_test_data()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ Seeding interrupted by user")
        exit(1)
    except Exception as e:
        print(f"❌ Seeding failed with unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    main()