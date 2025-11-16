import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// se regista el locale es espaniol
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      /* esto permite que cada vez que se navegue, te lleve a la parte de arriba de la pagina */
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    { provide: LOCALE_ID, useValue: 'es' },
    provideHttpClient(),
  ],
};
