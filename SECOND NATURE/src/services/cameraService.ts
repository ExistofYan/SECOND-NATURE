export type CameraErrorKind =
  | "not_supported" // no getUserMedia / insecure context
  | "denied" // permission refused
  | "not_found" // no camera device
  | "in_use" // device busy
  | "unknown";

export class CameraError extends Error {
  constructor(
    readonly kind: CameraErrorKind,
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "CameraError";
  }
}

/**
 * One shared MediaStream for the whole app (spec §3).
 * The scanning loop (QR) and sorting loop (hands) reuse getStream();
 * neither may request a second stream.
 */
class CameraService {
  private stream: MediaStream | null = null;

  isSecureContext(): boolean {
    return typeof window !== "undefined" && (window.isSecureContext || location.hostname === "localhost");
  }

  async start(): Promise<MediaStream> {
    if (this.stream && this.stream.active) return this.stream;
    if (!this.isSecureContext()) {
      throw new CameraError("not_supported", "Camera needs localhost or HTTPS (insecure context).");
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraError("not_supported", "This browser does not support camera access.");
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user", frameRate: { ideal: 60, max: 60 } },
        audio: false,
      });
      return this.stream;
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "SecurityError") {
        throw new CameraError("denied", "Camera permission was refused. Enable it and retry.", e.message);
      }
      if (e.name === "NotFoundError" || e.name === "OverconstrainedError") {
        throw new CameraError("not_found", "No camera device found.", e.message);
      }
      if (e.name === "NotReadableError" || e.name === "AbortError") {
        throw new CameraError("in_use", "Camera is occupied by another application.", e.message);
      }
      throw new CameraError("unknown", "Camera failed to start.", e.message);
    }
  }

  getStream(): MediaStream | null {
    return this.stream && this.stream.active ? this.stream : null;
  }

  stop(): void {
    if (this.stream) {
      for (const t of this.stream.getTracks()) t.stop(); // spec §14: stop ALL tracks
      this.stream = null;
    }
  }
}

export const cameraService = new CameraService();
