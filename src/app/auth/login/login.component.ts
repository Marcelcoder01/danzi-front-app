import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('loginVideo')
  loginVideo!: ElementRef<HTMLVideoElement>;

  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faArrowRight = faArrowRight;

  showPassword = false;

  private videoRetry?: ReturnType<typeof setInterval>;

  constructor(private router: Router) {}

ngAfterViewInit(): void {
  const video = this.loginVideo.nativeElement;

  video.muted = true;
  video.loop = true;
  video.playsInline = true;

  video.playbackRate = 0.80;

  this.playVideo(video);

  video.addEventListener('canplay', () => {
    this.playVideo(video);
  });

  this.videoRetry = setInterval(() => {
    if (video.paused || video.ended) {
      this.playVideo(video);
    }
  }, 1000);
}

  private playVideo(video: HTMLVideoElement): void {
    video.play().catch(() => {
      // El navegador puede rechazar temporalmente el autoplay.
      // Se volverá a intentar mediante el watchdog.
    });
  }

  ngOnDestroy(): void {
    if (this.videoRetry) {
      clearInterval(this.videoRetry);
    }
  }

  onSubmit(): void {
    this.router.navigate(['/admin']);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get passwordIcon() {
    return this.showPassword ? this.faEyeSlash : this.faEye;
  }
}