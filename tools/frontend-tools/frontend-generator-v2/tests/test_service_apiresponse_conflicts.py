#!/usr/bin/env python3
"""
Test case for service ApiResponse conflicts that reproduce the exact build errors.

This test reproduces the issue where:
1. Multiple service files in the same directory each export their own ApiResponse<T> interface
2. The barrel uses 'export *' causing conflicts like: "Module './authService' has already exported a member named 'ApiResponse'"
3. The barrel generator should detect these conflicts and use qualified imports instead
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def create_service_apiresponse_conflict_structure():
    """Create test structure that reproduces the exact service ApiResponse conflicts"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create gameplay services directory (matches the actual build error location)
    gameplay_dir = test_dir / "src" / "services" / "gameplay"
    gameplay_dir.mkdir(parents=True)
    
    # Create gamesService.ts with ApiResponse export (matches actual generated file)
    games_service_content = '''// Generated service for Game
import type { Game } from '../../types/gameplay/games';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

class GameService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async createGame(data: Partial<Game>): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/games`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getGameById(id: string): Promise<Game> {
    const response = await fetch(`${this.baseUrl}/games/${id}`);
    return response.json();
  }
}

export const gamesService = new GameService();
export default gamesService;
'''
    
    # Create historicGamesService.ts with same ApiResponse export (causes conflict)
    historic_games_service_content = '''// Generated service for Historic Game
import type { HistoricGame } from '../../types/gameplay/historicGames';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

class HistoricGameService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getHistoricGames(): Promise<HistoricGame[]> {
    const response = await fetch(`${this.baseUrl}/historic-games`);
    return response.json();
  }
}

export const historicGamesService = new HistoricGameService();
export default historicGamesService;
'''
    
    # Write service files
    (gameplay_dir / "gamesService.ts").write_text(games_service_content)
    (gameplay_dir / "historicGamesService.ts").write_text(historic_games_service_content)
    
    return test_dir

def test_service_apiresponse_conflicts():
    """Test that service ApiResponse conflicts are detected and resolved with qualified imports"""
    print("🧪 Testing service ApiResponse conflict detection and resolution...")
    
    # Create test structure that matches the real build error scenario
    test_dir = create_service_apiresponse_conflict_structure()
    gameplay_dir = test_dir / "src" / "services" / "gameplay"
    
    try:
        # Initialize barrel generator
        generator = AdvancedBarrelGenerator(gameplay_dir, verbose=True)
        
        # Analyze service files in the gameplay directory
        print("📋 Analyzing gameplay service files...")
        for service_file in gameplay_dir.glob("*.ts"):
            if service_file.name != "index.ts":
                generator.analyze_file(service_file)
                
        # Build export registry (should detect ApiResponse conflicts)
        print("🔍 Building export registry...")
        generator.build_export_registry()
        
        # Check if ApiResponse conflicts were detected
        apiresponse_conflicts = [
            conflict for conflict in generator.conflicts 
            if conflict.export_name == "ApiResponse"
        ]
        
        print(f"📊 Found {len(apiresponse_conflicts)} ApiResponse conflicts")
        print(f"📊 Total conflicts detected: {len(generator.conflicts)}")
        
        # Generate barrel for the gameplay directory
        print("📦 Generating gameplay barrel...")
        barrel_content = generator.generate_barrel(gameplay_dir)
        
        print("📄 Generated barrel content:")
        print(barrel_content)
        
        # Check if barrel uses qualified imports to avoid conflicts
        uses_qualified_imports = ("export * as " in barrel_content)
        uses_conflicting_wildcard = ("export *" in barrel_content and "export * as" not in barrel_content)
        
        print(f"✅ Uses qualified imports: {uses_qualified_imports}")
        print(f"❌ Uses conflicting wildcard imports: {uses_conflicting_wildcard}")
        
        # Validate results
        success = True
        
        if len(apiresponse_conflicts) == 0:
            print("❌ FAIL: No ApiResponse conflicts detected (should find conflicts)")
            success = False
        else:
            print(f"✅ PASS: ApiResponse conflicts detected ({len(apiresponse_conflicts)} conflicts)")
        
        if uses_conflicting_wildcard:
            print("❌ FAIL: Barrel still uses conflicting wildcard exports that cause TS2308 errors")
            success = False
        elif uses_qualified_imports:
            print("✅ PASS: Barrel uses qualified imports to resolve conflicts")
        else:
            print("⚠️  WARNING: No wildcard imports detected, but not using qualified imports either")
        
        # Check specific files are handled correctly
        expected_services = ['gamesService', 'historicGamesService']
        for service in expected_services:
            qualified_pattern = f"export * as {service} from './{service}'"
            wildcard_pattern = f"export * from './{service}'"
            
            if qualified_pattern in barrel_content:
                print(f"✅ {service} uses qualified import (correct)")
            elif wildcard_pattern in barrel_content:
                print(f"❌ {service} uses wildcard import (causes conflicts)")
                success = False
            else:
                print(f"⚠️  {service} not found in barrel")
        
        return success, test_dir
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False, test_dir

def test_multiple_service_directories():
    """Test ApiResponse conflicts across multiple service directories"""
    print("🧪 Testing cross-directory ApiResponse conflicts...")
    
    test_dir = Path(tempfile.mkdtemp())
    services_dir = test_dir / "src" / "services"
    
    # Create multiple service directories with ApiResponse conflicts
    directories = ['authentication', 'learning', 'puzzles']
    
    for dir_name in directories:
        service_dir = services_dir / dir_name
        service_dir.mkdir(parents=True)
        
        # Create a service with ApiResponse export
        service_content = f'''// Generated service for {dir_name}
export interface ApiResponse<T> {{
  data: T;
  success: boolean;
  message?: string;
}}

class {dir_name.title()}Service {{
  async getData(): Promise<any> {{
    return {{ data: null, success: true }};
  }}
}}

export const {dir_name}Service = new {dir_name.title()}Service();
export default {dir_name}Service;
'''
        (service_dir / f"{dir_name}Service.ts").write_text(service_content)
        
        # Create individual directory barrel
        generator = AdvancedBarrelGenerator(service_dir, verbose=False)
        generator.analyze_file(service_dir / f"{dir_name}Service.ts")
        generator.build_export_registry()
        barrel_content = generator.generate_barrel(service_dir)
        (service_dir / "index.ts").write_text(barrel_content)
    
    # Now test the main services barrel
    try:
        generator = AdvancedBarrelGenerator(services_dir, verbose=True)
        
        # Analyze subdirectory barrels
        for barrel_file in services_dir.rglob("index.ts"):
            if barrel_file.parent != services_dir:  # Don't analyze the main barrel we're about to create
                generator.analyze_file(barrel_file)
        
        generator.build_export_registry()
        main_barrel_content = generator.generate_barrel(services_dir)
        
        print("📄 Main services barrel content:")
        print(main_barrel_content)
        
        # Check if main barrel uses qualified imports for subdirectories
        uses_qualified_subdirs = all(
            f"export * as {dir_name.replace('-', '')} from './{dir_name}'" in main_barrel_content
            for dir_name in directories
        )
        
        if uses_qualified_subdirs:
            print("✅ PASS: Main services barrel uses qualified imports for subdirectories")
            return True, test_dir
        else:
            print("❌ FAIL: Main services barrel doesn't use qualified imports")
            return False, test_dir
            
    except Exception as e:
        print(f"❌ Multi-directory test failed: {e}")
        return False, test_dir

if __name__ == "__main__":
    print("🧪 Running Service ApiResponse conflict tests...\n")
    
    # Test 1: Within-directory service ApiResponse conflicts
    print("=" * 60)
    print("TEST 1: Service ApiResponse conflicts (gameplay directory)")
    print("=" * 60)
    single_dir_success, single_test_dir = test_service_apiresponse_conflicts()
    
    # Test 2: Cross-directory ApiResponse conflicts
    print("\n" + "=" * 60)
    print("TEST 2: Cross-directory ApiResponse conflicts (services barrel)")
    print("=" * 60)
    multi_dir_success, multi_test_dir = test_multiple_service_directories()
    
    # Final results
    print(f"\n{'='*60}")
    print("FINAL RESULTS:")
    print(f"{'='*60}")
    
    overall_success = single_dir_success and multi_dir_success
    
    if single_dir_success:
        print("✅ TEST 1 PASSED: Single-directory service conflicts properly handled")
    else:
        print("❌ TEST 1 FAILED: Single-directory service conflicts not resolved")
        
    if multi_dir_success:
        print("✅ TEST 2 PASSED: Cross-directory service conflicts properly handled") 
    else:
        print("❌ TEST 2 FAILED: Cross-directory service conflicts not resolved")
        
    if overall_success:
        print("\n🎉 ALL TESTS PASSED: Service ApiResponse conflicts properly resolved")
    else:
        print("\n💥 SOME TESTS FAILED: Service ApiResponse conflicts not fully handled")
        print("\nThis matches the build errors:")
        print("- TS2308: Module has already exported a member named 'ApiResponse'")
        print("- The barrel generator needs to use qualified imports instead of wildcard exports")
        
    print(f"\n📁 Single-dir test files: {single_test_dir}")
    print(f"📁 Multi-dir test files: {multi_test_dir}")
    print("🧹 Clean up test directories when done testing")