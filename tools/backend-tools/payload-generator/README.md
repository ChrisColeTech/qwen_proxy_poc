# Chess Training Platform - Payload Generator V2

A comprehensive, modular test data generation and API payload system for the Chess Training Platform. This tool creates realistic test data in the database and generates valid API payloads for end-to-end testing.

## 🎯 Overview

The Payload Generator V2 is a complete testing infrastructure that:

1. **Seeds realistic test data** into your PostgreSQL database
2. **Generates API payloads** using real database IDs and relationships
3. **Provides end-to-end testing** from database to API layer
4. **Supports 13+ database tables** with proper relational integrity
5. **Creates fresh, unique data** on every run to avoid conflicts

## 🏗️ Architecture

```
payload-generator/
├── README.md                    # This comprehensive guide
├── payload_generator.py         # Main payload generator (entry point)
├── test_data_seeder.py         # Orchestrates the seeding process
├── real_test_ids.json          # Generated file with real database IDs
├── generated_payloads.json     # Generated API payloads
├── field_validator.py          # Validates field types and constraints
├── json_formatter.py           # Formats JSON fields properly
├── id_resolver.py              # Resolves ID relationships
└── seeders/                    # Modular seeding components
    ├── __init__.py
    ├── data_generators.py      # Realistic data generation utilities
    ├── database_manager.py     # Database connection & operations
    └── table_seeders.py        # Individual table seeders
```

## ✨ Key Features

### 🌱 **Modular Data Seeding**
- **DatabaseManager**: Handles connections, conflict resolution, and transactions
- **DataGenerators**: Creates chess-specific realistic data (FEN positions, player names, etc.)
- **Table Seeders**: Individual seeders for each table with proper relationships
- **Smart Conflict Resolution**: Handles unique constraints gracefully

### 🎲 **Dynamic Data Generation**
- **No duplicate records**: Each run generates fresh, unique data
- **Chess-themed realism**: Realistic chess player names, tournaments, openings
- **Proper relationships**: Foreign keys correctly reference existing records
- **Constraint compliance**: Respects all database CHECK constraints

### 🔄 **End-to-End Testing**
- **Database → API**: Tests the complete data flow
- **Real ID resolution**: Uses actual database IDs in payloads
- **Relationship integrity**: Maintains referential integrity across tables
- **Comprehensive coverage**: 34 different endpoint payloads

## 🚀 Quick Start

### Prerequisites

```bash
pip install faker psycopg2-binary
```

### Basic Usage

```bash
# Generate fresh test data and API payloads
python payload_generator.py

# Skip data seeding (use existing data)
python payload_generator.py --no-seed

# Seed data only (no payload generation)
python test_data_seeder.py
```

### Environment Setup

The system automatically reads database configuration from:
1. `DATABASE_URL` environment variable
2. `../../../backend-v2/.env` file

Example `.env`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

## 📊 Generated Test Data

### Core Tables (88+ records across 13 tables)

| Table | Records | Description |
|-------|---------|-------------|
| **users** | 5 | Chess players with unique usernames, ELO ratings |
| **user_profiles** | 3 | Extended user info (display names, countries, bios) |
| **user_sessions** | 3 | Active sessions with refresh tokens |
| **games** | 8 | Chess games with AI levels, FEN positions, PGN |
| **historic_games** | 4 | Famous chess games (Kasparov, Karpov, etc.) |
| **openings** | 5 | Chess openings with ECO codes and variations |
| **puzzles** | 10 | Tactical puzzles with FEN positions and solutions |
| **puzzle_sources** | 3 | Puzzle databases (Lichess, Chess.com, etc.) |
| **puzzle_attempts** | 15 | User puzzle solving attempts with scoring |
| **achievements** | 4 | Chess-specific achievements and milestones |
| **user_achievements** | 10 | User progress on achievements |
| **content** | 6 | Learning content (lessons, courses, exercises) |
| **user_content_progress** | 12 | User progress through learning materials |

### Sample Generated Data

**Realistic Chess Data:**
- Usernames: `swift_rook_091412183456_742`, `clever_queen_091412183502_891`
- Player Names: `Magnus Carlsen`, `Garry Kasparov`, `Bobby Fischer`
- Tournaments: `World Championship 2024`, `Candidates Tournament`
- Chess Positions: Valid FEN strings for various game states
- ECO Codes: `B92`, `E90`, `C20` (standard opening classifications)

## 🔧 Advanced Usage

### Custom Data Seeding

```python
from test_data_seeder import TestDataSeederV2

# Create seeder with custom options
seeder = TestDataSeederV2(cleanup_old_data=False)
success = seeder.seed_all_test_data()
```

### Payload Generation Only

```python
from payload_generator import PayloadGenerator

# Skip data seeding, use existing data
generator = PayloadGenerator(
    config_path="/Users/chris/Projects/llm-api-vault-v2/config/backend_config.json", 
    seed_fresh_data=False
)
payloads = generator.generate_all_payloads()
```

### Individual Table Seeding

```python
from seeders import UsersSeeder, DatabaseManager

db = DatabaseManager()
users_seeder = UsersSeeder(db)
user_ids = users_seeder.seed(count=10)  # Create 10 users
```

## 🏗️ Modular Components

### DatabaseManager
Handles all database operations with sophisticated conflict resolution:

```python
# Smart conflict resolution
user_id = db.insert_record('users', user_data, "UPDATE")
user_achievement_id = db.insert_record(
    'user_achievements', 
    data, 
    "ON CONFLICT (user_id, achievement_id) DO UPDATE SET progress = EXCLUDED.progress"
)
```

### DataGenerators
Chess-specific realistic data generation:

```python
generators = DataGenerators()

# Chess-themed data
username = generators.generate_username()          # "swift_rook_091412183456_742"
player = generators.generate_player_name()        # "Magnus Carlsen"
fen = generators.generate_chess_fen()             # Valid chess position
tournament = generators.generate_tournament_name() # "World Championship 2024"
eco = generators.generate_eco_code()              # "B92"
```

### Table Seeders
Individual seeders with proper relationship handling:

```python
# Seed users first (no dependencies)
user_ids = users_seeder.seed(count=5)

# Then seed dependent tables
profile_ids = user_profiles_seeder.seed(user_ids, count=3)
session_ids = user_sessions_seeder.seed(user_ids, count=3)
```

## 📋 Database Schema Compliance

### Constraint Handling
The seeder respects all database constraints:

```sql
-- Content type constraint
CHECK (content_type IN ('tutorial', 'lesson', 'course', 'exercise'))

-- Difficulty level constraint  
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))

-- Progress constraint
CHECK (completed_at IS NULL OR completed_at >= started_at)
```

### Foreign Key Relationships
Proper relationship management:
- `user_profiles.user_id` → `users.id`
- `games.user_id` → `users.id`  
- `puzzle_attempts.user_id` → `users.id`
- `puzzle_attempts.puzzle_id` → `puzzles.id`
- `user_achievements.user_id` → `users.id`
- `user_achievements.achievement_id` → `achievements.id`

## 🎯 API Payload Generation

### Generated Payloads
The system generates payloads for 34 different endpoints:

```json
{
  "users": {
    "POST": {
      "username": "clever_bishop_091412183456_891",
      "email": "clever_bishop_091412183456_891@example.com",
      "password": "password123",
      "chess_elo": 1847,
      "puzzle_rating": 2156
    },
    "PUT": { /* update payload */ },
    "PATCH": { /* partial update payload */ }
  },
  "puzzle_attempts": {
    "POST": {
      "user_id": "c004e422-9f3a-4fc8-8be6-f37efb17f133",  // Real user ID
      "puzzle_id": "f27bfd4f-5349-4d54-af33-4c75b9fc46e3", // Real puzzle ID
      "moves": "Qd8+",
      "correct": true,
      "time_taken": 45,
      "rating_change": 12
    }
  }
}
```

### ID Resolution
Real database IDs are automatically resolved:
```python
# Before: test-user_id-20250914121823
# After:  c004e422-9f3a-4fc8-8be6-f37efb17f133 (actual user ID)
```

## 🧪 Testing Integration

### End-to-End Test Flow

1. **Database Seeding** 🌱
   ```bash
   🚀 Starting comprehensive test data seeding...
   👥 Seeding users... ✅ 5 records
   🧩 Seeding puzzles... ✅ 10 records
   ♔ Seeding games... ✅ 8 records
   🎯 Total Records Created: 88
   ```

2. **Payload Generation** 🔧
   ```bash
   🔧 Processing users payload with specialized modules...
   🔧 Resolved ID field 'user_id': test-user_id → c004e422-9f3a-4fc8-8be6-f37efb17f133
   📝 Generated 34 endpoint payloads
   ```

3. **API Testing** 🚀
   ```bash
   # Use generated payloads for comprehensive API testing
   curl -X POST /api/users -d @generated_payloads.json[users][POST]
   ```

### Test Data Quality

**Chess-Specific Realism:**
- Valid FEN positions for all chess states
- Proper ECO codes for openings
- Realistic ELO ratings (800-2400 range)
- Authentic tournament and player names
- Proper chess move notation (PGN format)

**Data Relationships:**
- Users have profiles, sessions, and game history
- Puzzles have sources and user attempts
- Content has progress tracking per user
- Achievements have user progress records

## 🔍 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
❌ Failed to connect to database: connection refused
```
**Solution:** Check `DATABASE_URL` in `.env` file or environment variables.

**2. Constraint Violations**
```bash
❌ new row violates check constraint "content_content_type_check"
```
**Solution:** The seeder handles all known constraints. If you see this, a new constraint was added.

**3. Missing Dependencies**
```bash
❌ Failed to import seeder modules: No module named 'faker'
```
**Solution:** Run `pip install faker psycopg2-binary`

**4. Unique Constraint Violations**
```bash
❌ duplicate key value violates unique constraint
```
**Solution:** The seeder uses smart conflict resolution. This shouldn't happen in normal operation.

### Debug Mode

Enable detailed logging:
```python
# In test_data_seeder.py
seeder = TestDataSeederV2(cleanup_old_data=True)  # Enable cleanup
```

## 📈 Performance & Scalability

### Current Performance
- **Seeding Time**: ~4-6 seconds for 88 records
- **Memory Usage**: ~50MB peak during seeding
- **Database Connections**: Single connection with transaction management
- **Payload Generation**: ~1-2 seconds for 34 endpoints

### Scaling Considerations
- **Batch Processing**: Insert operations use efficient batch inserts
- **Connection Pooling**: Uses single connection with proper cleanup
- **Memory Management**: Generators create data on-demand
- **Conflict Resolution**: Smart upserts prevent duplicate processing

## 🔮 Future Enhancements

### Planned Features
1. **Configuration-Driven Seeding**: YAML/JSON config for custom data volumes
2. **Data Export/Import**: Backup and restore test data sets  
3. **Performance Profiling**: Built-in timing and memory usage reporting
4. **Custom Generators**: Plugin system for domain-specific data
5. **API Integration Testing**: Direct API endpoint testing with generated payloads

### Extension Points
```python
# Custom data generator
class CustomChessGenerator(DataGenerators):
    def generate_grandmaster_name(self):
        return random.choice(['Hikaru Nakamura', 'Ding Liren', 'Ian Nepomniachtchi'])

# Custom table seeder  
class TournamentsSeeder(BaseSeeder):
    def seed(self, count: int = 5):
        # Implementation for tournament-specific data
        pass
```

## 🎓 Lessons Learned

### Key Insights from Development

**1. Database Constraints Are Critical**
- Always check constraint definitions before generating data
- Use `pg_get_constraintdef()` to understand complex constraints
- Handle foreign key relationships in dependency order

**2. Modular Design Pays Off**
- Separating concerns (data generation, database ops, seeding logic) made the system maintainable
- Individual table seeders allow fine-grained control
- Reusable components reduce code duplication

**3. Realistic Data Matters**  
- Chess-specific data (FEN, ECO codes, player names) makes testing more meaningful
- Proper relationships between records catch real-world bugs
- Constraint violations during development reveal schema issues

**4. Smart Conflict Resolution**
- Using `ON CONFLICT` clauses prevents duplicate insertion errors
- Custom conflict resolution per table handles unique constraints properly
- Graceful degradation when constraints are violated

**5. End-to-End Testing Value**
- Database → API payload flow tests the complete system
- Real ID resolution catches broken relationships
- Fresh data on each run prevents test pollution

### Technical Decisions

**Why PostgreSQL-Specific?**
- Advanced constraint support (CHECK, UNIQUE combinations)
- Excellent UPSERT capabilities with ON CONFLICT
- JSON/JSONB support for complex data types
- Mature Python libraries (psycopg2)

**Why Faker Library?**
- Realistic data generation out of the box
- Extensible for domain-specific needs
- Consistent API across data types
- Good performance for test data volumes

**Why Modular Architecture?**
- Easy to test individual components
- Allows parallel development of different seeders
- Simple to extend for new tables/requirements
- Clear separation of concerns

## 📚 API Reference

### PayloadGenerator Class
```python
class PayloadGenerator:
    def __init__(self, config_path: str, seed_fresh_data: bool = True)
    def generate_all_payloads() -> Dict[str, Any]
    def _seed_fresh_data() -> None
    def _load_real_ids() -> Dict[str, str]
```

### TestDataSeederV2 Class
```python
class TestDataSeederV2:
    def __init__(self, cleanup_old_data: bool = True)
    def seed_all_test_data() -> bool
    def _seed_users() -> List[str]
    def _seed_puzzles() -> List[str]
    # ... individual seeding methods
```

### DatabaseManager Class
```python
class DatabaseManager:
    def table_exists(self, table_name: str) -> bool
    def insert_record(self, table_name: str, data: Dict, conflict_resolution: str) -> Optional[Any]
    def get_random_existing_id(self, table_name: str, id_column: str = 'id') -> Optional[Any]
    def cleanup_test_records(self, patterns: List[str] = None) -> None
```

### DataGenerators Class
```python
class DataGenerators:
    def generate_username() -> str
    def generate_chess_fen() -> str
    def generate_player_name() -> str
    def generate_tournament_name() -> str
    def generate_eco_code() -> str
    def generate_chess_elo() -> int
    # ... 20+ specialized generators
```

## 🤝 Contributing

### Development Setup
```bash
cd tools/backend-tools/payload-generator
pip install faker psycopg2-binary
python test_data_seeder.py  # Test seeding
python payload_generator.py  # Test full pipeline
```

### Adding New Table Seeders
1. Create seeder class in `seeders/table_seeders.py`
2. Add to imports in `seeders/__init__.py`
3. Add seeding method to `TestDataSeederV2`
4. Update summary reporting

### Code Style
- Follow existing naming conventions
- Add docstrings to all public methods
- Use type hints where possible
- Keep individual methods focused and small

## 📄 License

This code is part of the Chess Training Platform project. All rights reserved.

---

## 📞 Support

For questions or issues with the Payload Generator:

1. Check this README for common solutions
2. Review database constraints and schema
3. Verify environment configuration  
4. Test individual components in isolation

**Remember:** This tool creates a complete end-to-end testing pipeline from database seeding to API payload generation. It's designed to be the foundation for comprehensive integration testing of your chess training platform! 🚀♔