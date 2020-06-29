import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));


    // tslint:disable-next-line:space-before-function-paren
String.prototype.ucFirst = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};
// tslint:disable-next-line:space-before-function-paren
String.prototype.ucWords = function () {
  return this.split(' ')
    .map((str: string) => str.ucFirst())
    .join(' ');
};
