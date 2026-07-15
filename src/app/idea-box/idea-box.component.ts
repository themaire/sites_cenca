import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-idea-box',
  standalone: true,
  imports: [],
  templateUrl: './idea-box.component.html',
  styleUrl: './idea-box.component.scss'
})
export class IdeaBoxComponent {
  airtableUrl: SafeResourceUrl;

  constructor(sanitizer: DomSanitizer) {
    this.airtableUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://airtable.com/embed/app1OV1pVvK6L7tmE/shr8KcbJylXs7KmWE'
    );
  }
}
