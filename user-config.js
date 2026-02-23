window.APP_CONFIG = {
  defaultGoogleSheetUrl:
    "https://docs.google.com/spreadsheets/d/1siauzxZ9ai1zq-XwSFRVmcS_h9PE9qRjEU5Db58OmE0/edit?gid=0#gid=0",
  autoSyncOnLoad: false,
  auth: {
    enabled: true,
    sessionHours: 72,
    users: [{ username: "admin", password: "1234" }],
  },
  supabase: {
    enabled: true,
    projectRef: "endoewncpfjneqphvxvv",
    projectUrl: "https://endoewncpfjneqphvxvv.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZG9ld25jcGZqbmVxcGh2eHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3Njg3MTksImV4cCI6MjA4NzM0NDcxOX0.VuWgvhxVtz0TTTGM-_0ttv30tTzXtVmv9bBeGDuwBAg",
    stateTable: "inventory_state",
    stateRowId: "4danji-main",
  },
  cloudSync: {
    enabled: false,
    baseUrl: "",
    token: "",
    pullOnInit: true,
    autoPush: true,
    pushDebounceMs: 1200,
    timeoutMs: 15000,
  },
};
