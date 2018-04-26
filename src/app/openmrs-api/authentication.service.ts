import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { AppSettingsService } from '../app-settings';
import { SessionService } from './session.service';
import { LocalStorageService } from '../utils/local-storage.service';
import { SessionStorageService } from '../utils/session-storage.service';
import { Constants } from '../utils/constants';
import { Observable } from 'rxjs/Observable';
import { CookieService } from 'ngx-cookie';

@Injectable()
export class AuthenticationService {

  private saveOfflineCreds: boolean = false;

  constructor(
    private appSettingsService: AppSettingsService,
    private localStorageService: LocalStorageService,
    private sessionStorageService: SessionStorageService,
    private sessionService: SessionService,
    private _cookieService: CookieService) { }

  public authenticate(username: string, password: string) {

    let credentials = {
      username: username,
      password: password
    };

    let request = this.sessionService.getSession(credentials);

    request
      .subscribe(
      (response: Response) => {

        let data = response.json();

        if (data.authenticated) {

          if (!this.saveOfflineCreds) {
            this.setCredentials(username, password);
          } else {
            this.setAndSaveCredentials(username, password, true);
          }

          // store logged in user details in session storage
          let user = data.user;
          this.storeUser(user);
        }
      });

    return request;
  }

  public authenticateAndSave(username: string, password: string, saveOfflineCreds: boolean) {

    this.saveOfflineCreds = saveOfflineCreds;
    this.authenticate(username, password);
  }

  public offlineAuthenticate(username: string, password: string) {

    let credentials = {
      username: username,
      password: password
    };

    let enteredCredentials = btoa(username + ':' + password);
    let storedCredentials = this.localStorageService.getItem(Constants.CREDENTIALS_KEY);
    if (enteredCredentials === storedCredentials) {
      this.sessionStorageService.setObject(Constants.USER_KEY,
        this.localStorageService.getObject(Constants.USER_KEY));
      this.sessionStorageService.setItem(Constants.CREDENTIALS_KEY,
        this.localStorageService.getItem(Constants.CREDENTIALS_KEY));
      return true;
    }
    return false;
  }

  public logOut() {

    let response = this.sessionService.deleteSession();

    response
      .subscribe(
      (res: Response) => {

        this.clearSessionCache();
      },
      (error: Error) => {

        this.clearSessionCache();
      });

    return response;
  }

  public clearSessionCache() {
    this.clearLoginAlertCookies();
    this.clearCredentials();
    this.clearUserDetails();
  }
  // This will clear motd alert cookies set  at every log in
  public clearLoginAlertCookies() {

      let cookieKey = 'motdLoginCookie';

      this._cookieService.remove(cookieKey);

  }

  private setCredentials(username: string, password: string) {
    let base64 = btoa(username + ':' + password);
    this.sessionStorageService.setItem(Constants.CREDENTIALS_KEY, base64);
  }
  private setAndSaveCredentials(username: string, password: string, isSaveOffline: boolean) {
    if (isSaveOffline) {
      let base64 = btoa(username + ':' + password);
      this.localStorageService.setItem(Constants.CREDENTIALS_KEY, base64);
    }
    this.setCredentials(username, password);
  }
  private clearCredentials() {

    this.sessionStorageService.remove(Constants.CREDENTIALS_KEY);
  }

  private storeUser(user: any) {
    this.sessionStorageService.setObject(Constants.USER_KEY, user);
    this.localStorageService.setObject(Constants.USER_KEY, user);
  }

  private clearUserDetails() {
    this.sessionStorageService.remove(Constants.USER_KEY);
  }
}
