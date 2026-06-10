import { ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { filter, first } from 'rxjs';
import { environment } from './environments/environment';

const SPLASH_MAX_WAIT_MS = 6000;

const splashVersion = document.querySelector('.splash-version');
if (splashVersion) {
  splashVersion.textContent = `v${environment.appVersion ?? '0.0.0'}`;
}

let splashHidden = false;
const hideSplash = () => {
  if (splashHidden) return;
  splashHidden = true;
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.classList.add('splash-hidden');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  }
};

const splashFallbackTimer = setTimeout(hideSplash, SPLASH_MAX_WAIT_MS);

bootstrapApplication(AppComponent, appConfig)
  .then((appRef: ApplicationRef) => {
    appRef.isStable
      .pipe(filter(Boolean), first())
      .subscribe(() => {
        clearTimeout(splashFallbackTimer);
        hideSplash();
      });
  })
  .catch((err) => {
    clearTimeout(splashFallbackTimer);
    hideSplash();
    console.error(err);
  });
