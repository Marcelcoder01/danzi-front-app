import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBuilding,
  faCalendarDays,
  faClockRotateLeft,
  faCrown,
  faEnvelope,
  faGlobe,
  faHashtag,
  faLocationDot,
  faPhone,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@core/services/auth.service';
import {
  ORGANIZATION_ROLE_LABELS,
  ORGANIZATION_ROLES,
  ORGANIZATION_TYPE_LABELS,
  OrganizationRole,
} from '@domain/organizations/models/organization.model';
import { OrganizationContextService } from '@domain/organizations/services/organization-context.service';
import { OrganizationService } from '@domain/organizations/services/organization.service';
import { profileDisplayName } from '@domain/profile/models/user-profile.model';
import { UserProfileService } from '@domain/profile/services/user-profile.service';
import { initialsOf } from '@shared/utils/text.util';

interface TeamMemberRow {
  id: string;
  name: string;
  role: OrganizationRole;
  since: string;
  isCurrentUser: boolean;
}

const ROLE_BADGE_CLASSES: Record<OrganizationRole, string> = {
  owner: 'bg-[var(--color-accent)]/10 text-[var(--color-accent-dark)]',
  admin: 'bg-[var(--color-info)]/10 text-[var(--color-info-dark)]',
  teacher: 'bg-[var(--color-success)]/10 text-[var(--color-success-dark)]',
};

@Component({
  selector: 'app-organization-info-dialog',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './organization-info-dialog.component.html',
})
export class OrganizationInfoDialogComponent {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLDialogElement>;

  private readonly context = inject(OrganizationContextService);
  private readonly organizations = inject(OrganizationService);
  private readonly profiles = inject(UserProfileService);
  private readonly auth = inject(AuthService);

  readonly organization = this.context.activeOrganization;
  readonly role = this.context.activeRole;
  readonly team = signal<TeamMemberRow[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly roleLabels = ORGANIZATION_ROLE_LABELS;
  readonly typeLabels = ORGANIZATION_TYPE_LABELS;
  readonly roleBadgeClasses = ROLE_BADGE_CLASSES;
  readonly initialsOf = initialsOf;

  readonly faXmark = faXmark;
  readonly faBuilding = faBuilding;
  readonly faCalendarDays = faCalendarDays;
  readonly faClockRotateLeft = faClockRotateLeft;
  readonly faCrown = faCrown;
  readonly faUsers = faUsers;
  readonly faEnvelope = faEnvelope;
  readonly faPhone = faPhone;
  readonly faLocationDot = faLocationDot;
  readonly faGlobe = faGlobe;
  readonly faHashtag = faHashtag;

  open(): void {
    this.dialog?.nativeElement.showModal();
    void this.loadTeam();
  }

  close(): void {
    this.dialog?.nativeElement.close();
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(value));
  }

  yearOf(value: string | null | undefined): string {
    return value ? String(new Date(value).getFullYear()) : '—';
  }

  location(): string {
    const organization = this.organization();
    if (!organization) return '—';
    return [organization.address, organization.city, organization.countryCode]
      .filter(Boolean)
      .join(', ');
  }

  private async loadTeam(): Promise<void> {
    const organization = this.organization();
    if (!organization) return;
    this.isLoading.set(true);
    this.hasError.set(false);
    try {
      const members = await this.organizations.getMembers(organization.id);
      const profiles = await this.profiles
        .getByIds(members.map((member) => member.userId))
        .catch(() => []);
      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
      const currentUserId = this.auth.currentUser()?.id;

      const rows = members.map<TeamMemberRow>((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const name = isCurrentUser
          ? this.profiles.displayName()
          : profileDisplayName(profileById.get(member.userId) ?? null);
        return {
          id: member.id,
          name: name || 'Miembro del equipo',
          role: member.role,
          since: member.createdAt,
          isCurrentUser,
        };
      });
      rows.sort(
        (a, b) =>
          ORGANIZATION_ROLES.indexOf(a.role) - ORGANIZATION_ROLES.indexOf(b.role) ||
          a.since.localeCompare(b.since),
      );
      this.team.set(rows);
    } catch {
      this.team.set([]);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
