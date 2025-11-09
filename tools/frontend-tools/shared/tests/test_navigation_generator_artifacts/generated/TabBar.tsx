import { Gamepad, Settings } from "lucide-react";
import MenuButton from "./MenuButton";
import type { TabId } from "./types";
import { useAppStore } from "../../stores/appStore";

interface TabBarProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: "testsection",
    label: "TestSection",
    icon: Settings,
    description: "UI Testing Components",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad,
    description: "Gaming & Entertainment",
  }
];

export default function TabBar({ currentTab, onTabChange, isMenuOpen, onToggleMenu }: TabBarProps) {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);
  const handleKeyDown = (event: React.KeyboardEvent, tabId: TabId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTabChange(tabId);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      onTabChange(tabs[nextIndex].id);
    }
  };
  return (
    <div
      className="
        w-full h-[57px] 
        grid grid-cols-3
      "
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Menu Button - First item */}
      <MenuButton isMenuOpen={isMenuOpen} onToggleMenu={onToggleMenu} />

      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => {
              // Note: UI click sound is handled automatically by Global UI Audio System

              // If clicking on tabs that support child pages, clear any child page
              if (tab.id === 'testsection' || tab.id === 'gaming') {
                setCurrentChildPage(null);
              }

              onTabChange(tab.id);
            }}
            onMouseEnter={() => {
              // Note: UI hover sound is handled automatically by Global UI Audio System
            }}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            className={`tab-button ${isActive ? "tab-button-active" : "tab-button-inactive"}`}
          >
            <IconComponent
              className={isActive ? "tab-icon-active" : "tab-icon-inactive"}
            />
            <span className="leading-tight font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
