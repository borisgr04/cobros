import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { filter, first } from 'rxjs';
import { environment } from './environments/environment';

const splashVersion = document.querySelector('.splash-version');
if (splashVersion) {
  splashVersion.textContent = `v${environment.appVersion ?? '0.0.0'}`;
}

bootstrapApplication(AppComponent, appConfig)
  .then((appRef: ApplicationRef) => {
    appRef.isStable
      .pipe(filter(Boolean), first())
      .subscribe(() => {
        const splash = document.getElementById('app-splash');
        if (splash) {
          splash.classList.add('splash-hidden');
          splash.addEventListener('transitionend', () => splash.remove(), { once: true });
        }
      });
  })
  .catch((err) => console.error(err));
