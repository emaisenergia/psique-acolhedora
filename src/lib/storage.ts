export type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  // extended optional fields for richer UI (safe to ignore elsewhere)
  cpf?: string;
  birthDate?: string; // ISO YYYY-MM-DD
  gender?: string; // feminino | masculino | outro | nao_informar
  cep?: string;
  address?: string;
  profession?: string;
  status?: "active" | "inactive";
  color?: string; // hex color like #00FFAA
  emergencyContacts?: { name: string; phone?: string; relation?: string }[];
  medications?: { name: string; dosage?: string }[];
  createdAt: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  dateTime: string; // ISO
  service?: string;
  notes?: string;
  status?: "scheduled" | "done" | "cancelled";
  mode?: "online" | "presencial";
  fee?: number; // valor da sessão
  paymentStatus?: "paid" | "pending"; // status de pagamento
  createdAt: string;
};

export type Activity = {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO YYYY-MM-DD
  status: "pending" | "completed";
  assignedBy?: string;
  createdAt: string;
  completedAt?: string;
};

export type JournalEntry = {
  id: string;
  patientId: string;
  createdAt: string; // ISO
  mood: "muito_bem" | "bem" | "neutro" | "desafiador" | "dificil";
  note: string;
  tags?: string[];
};

export type SecureMessage = {
  id: string;
  patientId: string;
  author: "patient" | "psychologist";
  content: string;
  createdAt: string; // ISO
  urgent?: boolean;
  read?: boolean;
};

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string; // e.g. 15 Mar 2024
  iconName?: string; // e.g. "Heart"
  featured?: boolean;
  content: string; // plain text/markdown-ish
  createdAt: string;
  updatedAt?: string;
};

export type Role = "admin" | "psychologist" | "editor";
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — do NOT use in prod
  roles: Role[];
  createdAt: string;
  phone?: string;
  credential?: string;
  bio?: string;
  timezone?: string;
};

export type AdminPreferences = {
  theme: "system" | "light" | "dark";
  language: "pt-BR" | "en-US";
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  scheduling: {
    defaultView: "month" | "week" | "day";
    weekStartsOn: "monday" | "sunday";
  };
};

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AdminScheduleConfig = {
  timezone: string;
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  breakStart?: string;
  breakEnd?: string;
  slotDuration: number; // minutes
  gapBetweenAppointments: number; // minutes
  allowOnlineBooking: boolean;
  availableDays: Weekday[];
  notes?: string;
};

export type AdminInsurance = {
  id: string;
  name: string;
  code?: string;
  coverage?: string;
  notes?: string;
  createdAt: string;
};

export const defaultAdminPreferences: AdminPreferences = {
  theme: "system",
  language: "pt-BR",
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  scheduling: {
    defaultView: "week",
    weekStartsOn: "monday",
  },
};

export const defaultScheduleConfig: AdminScheduleConfig = {
  timezone: "America/Sao_Paulo",
  startHour: "08:00",
  endHour: "18:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  slotDuration: 50,
  gapBetweenAppointments: 10,
  allowOnlineBooking: true,
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  notes: "",
};

const KEYS = {
  patients: "admin_patients",
  appointments: "admin_appointments",
  posts: "admin_posts",
  auth: "admin_auth",
  users: "admin_users",
  activities: "admin_activities",
  journals: "patient_journals",
  messages: "patient_messages",
  preferences: "admin_preferences",
  scheduleConfig: "admin_schedule_config",
  insurances: "admin_insurances",
} as const;

export const storage = {
  // Auth
  setAuth(token: string) {
    localStorage.setItem(KEYS.auth, token);
  },
  getAuth(): string | null {
    return localStorage.getItem(KEYS.auth);
  },
  clearAuth() {
    localStorage.removeItem(KEYS.auth);
  },

  // Patients
  getPatients(): Patient[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.patients) || "[]");
    } catch {
      return [];
    }
  },
  savePatients(patients: Patient[]) {
    localStorage.setItem(KEYS.patients, JSON.stringify(patients));
  },

  // Appointments
  getAppointments(): Appointment[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.appointments) || "[]");
    } catch {
      return [];
    }
  },
  saveAppointments(appts: Appointment[]) {
    localStorage.setItem(KEYS.appointments, JSON.stringify(appts));
  },

  // Blog posts
  getPosts(): AdminBlogPost[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.posts) || "[]");
    } catch {
      return [];
    }
  },
  savePosts(posts: AdminBlogPost[]) {
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
  },

  // Users
  getUsers(): AdminUser[] {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYS.users) || "[]") as AdminUser[] | any[];
      if (!Array.isArray(raw)) return [];
      let migrated = false;
      const normalized = raw.map((user) => {
        const roles = (user.roles || []).map((role: string) => {
          if (role === "therapist") {
            migrated = true;
            return "psychologist";
          }
          return role;
        }) as Role[];
        return {
          ...user,
          roles,
          timezone: user.timezone || "America/Sao_Paulo",
        };
      }) as AdminUser[];
      if (migrated) {
        localStorage.setItem(KEYS.users, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },
  saveUsers(users: AdminUser[]) {
    localStorage.setItem(KEYS.users, JSON.stringify(users));
  },

  // Activities
  getActivities(): Activity[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.activities) || "[]");
    } catch {
      return [];
    }
  },
  saveActivities(activities: Activity[]) {
    localStorage.setItem(KEYS.activities, JSON.stringify(activities));
  },

  // Patient journals
  getJournalEntries(): JournalEntry[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.journals) || "[]");
    } catch {
      return [];
    }
  },
  saveJournalEntries(entries: JournalEntry[]) {
    localStorage.setItem(KEYS.journals, JSON.stringify(entries));
  },

  // Secure messages
  getMessages(): SecureMessage[] {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYS.messages) || "[]") as SecureMessage[] | any[];
      if (!Array.isArray(raw)) return [];
      let migrated = false;
      const normalized = raw.map((message) => {
        if (message.author === "therapist") {
          migrated = true;
          return { ...message, author: "psychologist" as const };
        }
        return message;
      }) as SecureMessage[];
      if (migrated) {
        localStorage.setItem(KEYS.messages, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },
  saveMessages(messages: SecureMessage[]) {
    localStorage.setItem(KEYS.messages, JSON.stringify(messages));
  },

  // Admin preferences
  getAdminPreferences(): AdminPreferences {
    try {
      const raw = localStorage.getItem(KEYS.preferences);
      if (!raw) return defaultAdminPreferences;
      const parsed = JSON.parse(raw) as Partial<AdminPreferences>;
      return {
        ...defaultAdminPreferences,
        ...parsed,
        notifications: {
          ...defaultAdminPreferences.notifications,
          ...(parsed?.notifications ?? {}),
        },
        scheduling: {
          ...defaultAdminPreferences.scheduling,
          ...(parsed?.scheduling ?? {}),
        },
      };
    } catch {
      return defaultAdminPreferences;
    }
  },
  saveAdminPreferences(pref: AdminPreferences) {
    localStorage.setItem(KEYS.preferences, JSON.stringify(pref));
  },

  // Admin schedule
  getScheduleConfig(): AdminScheduleConfig {
    try {
      const raw = localStorage.getItem(KEYS.scheduleConfig);
      if (!raw) return defaultScheduleConfig;
      const parsed = JSON.parse(raw) as Partial<AdminScheduleConfig>;
      return {
        ...defaultScheduleConfig,
        ...parsed,
        availableDays:
          Array.isArray(parsed?.availableDays) && parsed?.availableDays.length
            ? (parsed.availableDays as Weekday[])
            : [...defaultScheduleConfig.availableDays],
      };
    } catch {
      return defaultScheduleConfig;
    }
  },
  saveScheduleConfig(config: AdminScheduleConfig) {
    localStorage.setItem(KEYS.scheduleConfig, JSON.stringify(config));
  },

  // Admin insurances
  getInsuranceProviders(): AdminInsurance[] {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYS.insurances) || "[]") as AdminInsurance[] | any[];
      if (!Array.isArray(raw)) return [];
      return raw.map((item) => ({
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
      })) as AdminInsurance[];
    } catch {
      return [];
    }
  },
  saveInsuranceProviders(providers: AdminInsurance[]) {
    localStorage.setItem(KEYS.insurances, JSON.stringify(providers));
  },
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const seedDefaultUsers = () => {
  const users = storage.getUsers();
  if (users.length === 0) {
    const admin: AdminUser = {
      id: uid(),
      name: "Admin",
      email: "admin@local",
      password: "equanimite",
      roles: ["admin", "editor", "psychologist"],
      createdAt: new Date().toISOString(),
      phone: "",
      credential: "",
      bio: "",
      timezone: "America/Sao_Paulo",
    };
    storage.saveUsers([admin]);
  }
};
