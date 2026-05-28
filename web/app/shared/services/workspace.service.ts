import { Injectable, signal } from '@angular/core';

export interface SubProject {
  name: string;
  status: 'running' | 'offline' | 'error';
  port?: number;
  services?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  subProjects = signal<SubProject[]>([
    {
      name: 'Inventory Shell',
      status: 'running',
      port: 4200,
      services: ['Shell Core', 'Topnav', 'Sidebar'],
    },
  ]);
  selectedProjectIndex = signal(0);

  constructor() {
    this.loadManifestProjects();
  }

  private async loadManifestProjects() {
    try {
      const response = await fetch('/federation.manifest.json');
      const manifest = await response.json();

      const projects: SubProject[] = [
        {
          name: 'Inventory Shell',
          status: 'running',
          port: 4200,
          services: ['Shell Core', 'Topnav', 'Sidebar'],
        },
      ];

      for (const [key, value] of Object.entries(manifest)) {
        const url = value as string;
        const portMatch = url.match(/:(\d+)\//);
        const port = portMatch ? parseInt(portMatch[1], 10) : undefined;
        const name = key
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        let services: string[] = [];
        try {
          // Fetch the remote manifest to see what it exposes
          const remoteResponse = await fetch(url);
          const remoteManifest = await remoteResponse.json();
          if (remoteManifest.exposes) {
            services = Object.keys(remoteManifest.exposes).map((s) =>
              s
                .replace('./', '')
                .replace(/-/g, ' ')
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            );
          }
        } catch (e) {
          console.warn(`Could not fetch remote manifest for ${key}`, e);
        }

        projects.push({
          name: name,
          status: 'running',
          port: port,
          services: services.length > 0 ? services : ['Core Module'],
        });
      }

      this.subProjects.set(projects);
    } catch (err) {
      console.error('Error loading manifest projects:', err);
    }
  }

  getSelectedProject(): SubProject | undefined {
    return this.subProjects()[this.selectedProjectIndex()];
  }

  selectProject(index: number): void {
    this.selectedProjectIndex.set(index);
  }
}
