import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { Miembro } from '../models/miembro';
import { AuthResponseDTO } from '../models/auth/auth-response-dto';
import { MiembroDetailDTO } from '../models/auth/miembro-detail-dto';
import { LoginRequestDTO } from '../models/auth/login-request-dto';
import { RegistroRequestDTO } from '../models/auth/registro-request-dto';
import { Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { computed } from '@angular/core';
import { signal } from '@angular/core';
import { CambiarContraseniaDTO } from '../models/auth/cambiar-contrasenia-dto';
import { TokenService } from './token-service';
import { extraerMensajeError } from '../utils/http-error';
import { DATABASE_BASE_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  private authUrl = `${DATABASE_BASE_URL}/auth`;

  private currentUserSignal = signal<Miembro | null>(null);
  private currentUserSubject = new BehaviorSubject<Miembro | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => this.currentUserSignal()?.rol === 'ADMINISTRADOR');
  isUsuario = computed(() => this.currentUserSignal()?.rol === 'MIEMBRO');
  nombreCompleto = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.nombre} ${user.apellido}` : '';
  });
  usuarioId = computed(() => this.currentUserSignal()?.id ?? null);

  constructor() {
    this.loadUserFromStorage();
    this.currentUser$.subscribe((user) => this.currentUserSignal.set(user));
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');

    if (userJson) {
      try {
        const user: Miembro = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Error al parsear usuario del localStorage', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  private setCurrentUser(user: Miembro): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
  }

  public actualizarUsuarioLocal(usuarioActualizado: Miembro) {
    this.setCurrentUser(usuarioActualizado);
  }

  login(loginDto: LoginRequestDTO): Observable<Miembro> {
    return this.http.post<AuthResponseDTO>(`${this.authUrl}/login`, loginDto).pipe(
      map((respuesta) => {
        this.tokenService.setToken(respuesta.token);

        // El login no devuelve email ni activo: el email sale del formulario, y activo=true
        // es seguro porque un miembro inactivo nunca llega a recibir 200 acá.
        const miembro: Miembro = {
          id: respuesta.id,
          nombre: respuesta.nombre,
          apellido: respuesta.apellido,
          rol: respuesta.rol,
          email: loginDto.email,
          activo: true,
        };

        this.setCurrentUser(miembro);

        return miembro;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en login:', error);
        return throwError(() => new Error(this.mensajeLogin(error)));
      })
    );
  }

  // El backend no usa 401 para credenciales inválidas: 404 = email no registrado, 400 = contraseña
  // incorrecta o cuenta inactiva (docs/api/1-auth.md).
  private mensajeLogin(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'Email no encontrado. Registrate o intentalo nuevamente.';
    }
    return extraerMensajeError(error);
  }

  register(registroDto: RegistroRequestDTO): Observable<Miembro> {
    // /auth/registro no devuelve token: encadenamos un login para dejar la sesión iniciada.
    return this.http.post<MiembroDetailDTO>(`${this.authUrl}/registro`, registroDto).pipe(
      switchMap(() =>
        this.login({ email: registroDto.email, contrasenia: registroDto.contrasenia })
      ),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en registro:', error);
        const mensaje =
          error.status === 409 ? 'El email ya está registrado' : extraerMensajeError(error);
        return throwError(() => new Error(mensaje));
      })
    );
  }

  cambiarPassword(dto: CambiarContraseniaDTO): Observable<string> {
    return this.http
      .put(
        `${this.authUrl}/cambiar-contrasenia`,
        { contraseniaVieja: dto.actual, nuevaContrasenia: dto.nueva },
        { responseType: 'text' } // el backend responde texto plano, no JSON
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al cambiar contraseña:', error);
          return throwError(() => new Error(extraerMensajeError(error)));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.tokenService.clear();
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  // Usado por el error-interceptor: limpia la sesión sin navegar (el interceptor redirige).
  cerrarSesionPorExpiracion(): void {
    localStorage.removeItem('currentUser');
    this.tokenService.clear();
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
  }

  getCurrentUser(): Miembro | null {
    return this.currentUserSubject.value;
  }

  estaLogeado(): boolean {
    return !!localStorage.getItem('currentUser') && !this.tokenService.isExpired();
  }

  esDueno(idMiembro: number): boolean {
    const user = this.currentUserSignal();
    return user !== null && user.id === idMiembro;
  }

  puedeEditar(idMiembro: number): boolean {
    return this.esDueno(idMiembro);
  }

  puedeEliminar(idMiembro: number): boolean {
    return this.isAdmin() || this.esDueno(idMiembro);
  }

  obtenerIdUsuarioActual(): number | null {
    return this.usuarioId();
  }
}
