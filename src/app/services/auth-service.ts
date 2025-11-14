import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { Miembro } from '../models/miembro';
import { MiembroDdDTO } from '../models/auth/miembro-dd-dto';
import { LoginRequestDTO } from '../models/auth/login-request-dto';
import { CrearMiembroDTO } from '../models/auth/crear-miembro-dto';
import { RegistroRequestDTO } from '../models/auth/registro-request-dto';
import { Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { computed } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSignal = signal<Miembro | null>(null);

  //Uso de computed -> Solo recalcula cuando cambia currentUserSignal, ahorrando recursos.
  //Si el usuario esta logeado, retorna true. Lee el signal y determina si es distinto de nulo.
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  //Hace lo mismo, se fija que rol tiene.
  isAdmin = computed(() => this.currentUserSignal()?.rol === 'administrador');
  isUsuario = computed(() => this.currentUserSignal()?.rol === 'usuario');

  private apiUrl = 'http://localhost:3000/miembros';

  // BehaviorSubject: guarda el estado del usuario actual
  // Cualquier componente puede suscribirse y recibir actualizaciones. La diferencia con un subject es que
  //el behaviorSubject guarda el ultimo estado del usuario.

  private currentUserSubject = new BehaviorSubject<Miembro | null>(null);

  // Observable público para que los componentes se suscriban. Sin esto podrian aceder directamente al currentUserSubject.
  //Se usa el signo pesos al final por convención porque es un observable.
  //Al ser solo lectura (Observable) solo se puede escuhar (".subscribe()")
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Al iniciar el servicio, intentar cargar usuario del localStorage
    this.loadUserFromStorage();
  }

  //Si existe, carga el usuario desde LocalStorage.
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');

    if (userJson) {
      try {
        const user: Miembro = JSON.parse(userJson); //Guardo el MiembroSession del LocalStorage
        this.currentUserSubject.next(user); //Lo pongo en el BehaviorSubject.
        this.currentUserSignal.set(user); //Tambien en el CurrentUserSignal para lectura de roles.
      } catch (error) {
        console.error('Error al parsear usuario del localStorage', error);
        // Si hay error, se limpia el localStorage
        localStorage.removeItem('currentUser');
      }
    }
  }

  //Se guarda el usuario en LocalStorage
  private setCurrentUser(user: Miembro): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user); //Lo pongo en el BehaviorSubject.
    this.currentUserSignal.set(user); //Tambien en el CurrentUserSignal para lectura de roles.
  }

  //Pasamos de la base de datos a un miembro para el LocalStorage (Sin la contraseña expuesta)
  private toMiembro(miembroDb: MiembroDdDTO): Miembro {
    return {
      id: miembroDb.id,
      nombre: miembroDb.nombre,
      apellido: miembroDb.apellido,
      email: miembroDb.email,
      rol: miembroDb.rol,
      activo: miembroDb.activo,
    };
  }

  // LOGIN - Autentica un usuario
  login(loginDto: LoginRequestDTO): Observable<Miembro> {
    return this.http.get<MiembroDdDTO[]>(`${this.apiUrl}?email=${loginDto.email}`).pipe(
      map((miembros) => {
        // Si miembros tiene tamaño 0, es porque no se encontro nada con el email del LoginRequestDTO
        if (miembros.length === 0) {
          throw new Error('Email no encontrado. Registrate o intentalo nuevamente.');
        }
        //Si no, guardamos el miembro encontrado en la posición 0 (El email es único)
        const miembroDb = miembros[0];

        //Verificamos que la cuenta del usuario este activa.
        if (!miembroDb.activo) {
          throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
        }

        // Verificamos contraseña comparando la ingresada con la de la base de datos.
        if (miembroDb.contrasenia !== loginDto.contrasenia) {
          throw new Error('Contraseña incorrecta. Intentalo nuevamente');
        }

        // Habiendo validado que el mail existe y la contraseña es correcta,
        // convertimos a Miembro (sin contraseña) para guardar en el LocalStorage
        const miembro = this.toMiembro(miembroDb);

        // Guardar en localStorage y actualizar estado
        this.setCurrentUser(miembro);

        return miembro;
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  //Metodo auxiliar para modularizar el metodo register.
  emailYaRegistrado(email: string): Observable<boolean> {
    return this.http
      .get<MiembroDdDTO[]>(`${this.apiUrl}?email=${email}`)
      .pipe(map((miembros) => miembros.length > 0));
  }

  //Registro
  register(registroDto: RegistroRequestDTO): Observable<Miembro> {
    // Verificar que el email no exista
    return this.emailYaRegistrado(registroDto.email).pipe(
      switchMap((existe) => {
        //Usamos switchMap para leer el observable GET y ver si el email esta presente, despues devolver otro para el Post luego en el return.
        if (existe) {
          throw new Error('El email ya está registrado');
        }

        // Preparar datos para crear el miembro
        const nuevoMiembro: CrearMiembroDTO = {
          nombre: registroDto.nombre,
          apellido: registroDto.apellido,
          email: registroDto.email,
          contrasenia: registroDto.contrasenia,
          rol: 'usuario', //Por defecto, los registrados van a ser usuarios...
          activo: true,
        };

        // Crear miembro en JSON Server
        return this.http.post<MiembroDdDTO>(this.apiUrl, nuevoMiembro); //Acá se le va a asignar el ID
      }),
      map((miembroCreado) => {
        // Convertir a Miembro (sin contraseña, para el LocalStorage)
        const miembro = this.toMiembro(miembroCreado);

        // Guardar en localStorage y actualizar estado
        this.setCurrentUser(miembro);

        return miembro;
      }),
      catchError((error) => {
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  //LOGOUT - Limpia el localStorage y manda al inicio de logeo.
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  //Obtiene el usuario actual logeado.
  getCurrentUser(): Miembro | null {
    return this.currentUserSubject.value;
  }

  //El !! significa que devuelve true or false aunque el valor que obtenga sea un string. Si esta vacio seria false
  estaLogeado(): boolean {
    return !!localStorage.getItem('currentUser');
  }
}
