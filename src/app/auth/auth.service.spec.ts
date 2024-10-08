import {TestBed} from '@angular/core/testing';

import {AuthService} from './auth.service';
import {OAuthEvent, OAuthService, OAuthSuccessEvent} from 'angular-oauth2-oidc';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {SharedModule} from '../shared/shared.module';
import {Subject} from 'rxjs';
import {AuthNotificationService} from './notifications/auth-notification.service';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {AuthStatusActions} from '../state/auth/actions/auth-status.actions';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';

const mockAuthNotificationService = jasmine.createSpyObj<AuthNotificationService>({
  showImpendingLogoutDialog: void 0,
  showForcedLogoutDialog: void 0,
  showProgrammaticLogoutDialog: void 0,
});
describe('AuthService', () => {
  let service: AuthService;
  let mockOAuthEvents: Subject<OAuthEvent>;
  let mockOAuthService: jasmine.SpyObj<OAuthService>;
  let store: MockStore;

  beforeEach(() => {
    mockOAuthEvents = new Subject<OAuthEvent>();
    mockOAuthService = jasmine.createSpyObj<OAuthService>(
      {
        configure: void 0,
        hasValidAccessToken: false,
        loadDiscoveryDocument: Promise.resolve(new OAuthSuccessEvent('discovery_document_loaded')),
        loadDiscoveryDocumentAndLogin: Promise.resolve(false),
        loadDiscoveryDocumentAndTryLogin: Promise.resolve(false),
        loadUserProfile: Promise.resolve({}),
        restartSessionChecksIfStillLoggedIn: void 0,
        setupAutomaticSilentRefresh: void 0,
        silentRefresh: Promise.resolve(new OAuthSuccessEvent('silently_refreshed')),
        stopAutomaticRefresh: void 0,
        tryLogin: Promise.resolve(false),
        tryLoginCodeFlow: Promise.resolve(void 0),
        tryLoginImplicitFlow: Promise.resolve(false),
        logOut: void 0,
        getAccessToken: '',
        initCodeFlow: void 0,
      },
      {
        events: mockOAuthEvents.asObservable(),
      },
    );
    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        provideMockStore({}),
        {provide: OAuthService, useValue: mockOAuthService},
        {provide: AuthNotificationService, useValue: mockAuthNotificationService},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    store = TestBed.inject(MockStore);
  });

  describe('login', () => {
    it('initializes code flow', () => {
      service.login();

      expect(mockOAuthService.initCodeFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('shows dialog for forced logout and sets isAuthenticated', () => {
      const storeDispatchSpy = spyOn(store, 'dispatch');

      service.logout(true);

      expect(mockAuthNotificationService.showForcedLogoutDialog).toHaveBeenCalledTimes(1);
      expect(storeDispatchSpy).toHaveBeenCalledOnceWith(AuthStatusActions.setStatus({isAuthenticated: false}));
    });

    it('shows dialog for programmatic logout and sets isAuthenticated', () => {
      const storeDispatchSpy = spyOn(store, 'dispatch');

      service.logout(false);

      expect(mockAuthNotificationService.showProgrammaticLogoutDialog).toHaveBeenCalledTimes(1);
      expect(storeDispatchSpy).toHaveBeenCalledOnceWith(AuthStatusActions.setStatus({isAuthenticated: false}));
    });
  });

  describe('getAccessToken', () => {
    it('returns the access token from OAuthService', () => {
      const expectedResult = 'test-token';
      mockOAuthService.getAccessToken.and.returnValue(expectedResult);

      const result = service.getAccessToken();

      expect(result).toEqual(expectedResult);
    });
  });
});
