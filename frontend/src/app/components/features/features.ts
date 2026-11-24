import { Component } from '@angular/core';

@Component({
  selector: 'app-features',
  templateUrl: './features.html',
})
export class FeaturesComponent {
  protected readonly groups = [
    [
      { title: 'Arbeitsmappen organisieren', description: 'Behalte deine Tabellen in eigenen Arbeitsmappen im Blick und gib jeder Mappe einen passenden Namen.', icon: 'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3' },
      { title: 'Mehrere Tabellenblätter', description: 'Füge neue Blätter hinzu und ordne deine Daten übersichtlich innerhalb einer Arbeitsmappe.', icon: 'M8 3h13v13H8z M3 8v13h13 M8 8h13 M13 3v13' },
      { title: 'Schnell zwischen Blättern wechseln', description: 'Wähle ein Tabellenblatt direkt aus oder navigiere zum vorherigen und nächsten Blatt.', icon: 'M8 5l-7 7 7 7 M1 12h22 M16 5l7 7-7 7' },
    ],
    [
      { title: 'Daten bearbeiten', description: 'Aktualisiere deine Tabellen und halte die Inhalte deiner Arbeitsmappe auf dem neuesten Stand.', icon: 'M12 20H4V4h12 M14 14l7-7-3-3-7 7-1 4z' },
      { title: 'Änderungen speichern', description: 'Speichere deine Arbeitsmappen und greife über deinen Arbeitsbereich wieder darauf zu.', icon: 'M4 3h13l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8' },
      { title: 'Ordnung behalten', description: 'Entferne nicht mehr benötigte Tabellenblätter. Ein Blatt bleibt immer in deiner Arbeitsmappe erhalten.', icon: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7' },
    ],
  ];
}
