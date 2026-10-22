import { defineStore } from "pinia";
import { handTrackingService, HandModelError } from "../services/handTrackingService";
import { cameraService, CameraError } from "../services/cameraService";

export type PermissionState = "idle" | "loading" | "granted" | "denied" | "missing" | "in_use" | "unsupported";
export type ModelState = "idle" | "loading" | "ready" | "failed";

export const useDeviceStore = defineStore("device", {
  state: () => ({
    permission: "idle" as PermissionState,
    cameraError: null as string | null,
    cameraErrorKind: null as CameraError["kind"] | null,
    model: "idle" as ModelState,
    modelError: null as string | null,
    /** Deployment resources must be available before gesture trials. */
    assetsAvailable: true,
  }),

  getters: {
    cameraReady: (s) => s.permission === "granted",
    handReady: (s) => s.model === "ready",
    gestureUsable: (s) => s.permission === "granted" && s.model === "ready" && s.assetsAvailable,
  },

  actions: {
    async enableCamera() {
      this.cameraError = null;
      this.cameraErrorKind = null;
      this.permission = "loading";
      try {
        await cameraService.start();
        this.permission = "granted";
      } catch (err) {
        if (err instanceof CameraError) {
          this.permission =
            err.kind === "denied" ? "denied"
            : err.kind === "not_found" ? "missing"
            : err.kind === "in_use" ? "in_use"
            : err.kind === "not_supported" ? "unsupported"
            : "denied";
          this.cameraErrorKind = err.kind;
          this.cameraError = err.message;
        } else {
          this.permission = "denied";
          this.cameraError = String((err as Error).message ?? err);
        }
      }
      return this.permission;
    },

    stopCamera() {
      cameraService.stop();
      this.permission = "idle";
    },

    async prepareHandModel() {
      if (this.model === "ready") return true;
      this.model = "loading";
      this.modelError = null;
      try {
        await handTrackingService.init();
        this.model = "ready";
        return true;
      } catch (err) {
        this.model = "failed";
        this.modelError =
          err instanceof HandModelError
            ? [err.message, err.detail].filter(Boolean).join(' ')
            : String((err as Error).message ?? err);
        return false;
      }
    },

    setAssetsAvailable(v: boolean) {
      this.assetsAvailable = v;
      if (!v) this.model = "failed";
    },
  },
});
