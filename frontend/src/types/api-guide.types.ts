/**
 * API Guide Component Type Definitions
 * Contains all interfaces and types for API guide components
 */

export interface BaseUrlSectionProps {
  baseUrl: string;
}

export interface EndpointItemProps {
  method: string;
  endpoint: string;
  description: string;
}

export interface CodeExamplesCardProps {
  baseUrl: string;
}

export interface ExploreSectionProps {
  onNavigate: (route: string) => void;
}
