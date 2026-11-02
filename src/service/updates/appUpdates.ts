export type UpdateSeverity = "none" | "normal" | "persistent" | "mandatory";
export type AppRelease = {
  packageName: string; version: string; versionCode: number;
  downloadUrl: string; sha256: string; size: number; notes?: string;
};
export function updateSeverity(release: AppRelease, installedVersion: string, installedCode: number): UpdateSeverity {
  const valid = /^\d+\.\d+\.\d+$/;
  if (!valid.test(installedVersion) || !valid.test(release.version) || release.versionCode <= installedCode) return "none";
  const current=installedVersion.split('.').map(Number), latest=release.version.split('.').map(Number);
  for(let i=0;i<3;i++) {
    if(latest[i]<current[i]) return "none";
    if(latest[i]>current[i]) return i<2 ? "mandatory" : "persistent";
  }
  return "normal";
}
export function parseAppRelease(value: unknown, manifestUrl: string, installedCode: number): AppRelease | null {
  if (!value || typeof value !== "object") return null;
  const release = value as AppRelease;
  if (release.packageName !== "com.rian3054.inteliagentapp" ||
      !Number.isSafeInteger(release.versionCode) || release.versionCode <= installedCode ||
      typeof release.version !== "string" || !/^\d+\.\d+\.\d+$/.test(release.version) ||
      typeof release.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(release.sha256) ||
      !Number.isSafeInteger(release.size) || release.size <= 0 ||
      typeof release.downloadUrl !== "string") return null;
  try {
    const source = new URL(manifestUrl), download = new URL(release.downloadUrl, source);
    const github=download.protocol==='https:' && download.hostname==='github.com' && download.pathname.startsWith('/Rian6/inteliagent-app/releases/download/');
    const local=download.origin===source.origin && /^\/mobile\/releases\/inteliagent-\d+-[a-f0-9]{12}\.apk$/.test(download.pathname);
    if ((!github&&!local) || download.username || download.password || !download.pathname.endsWith('.apk') || !['http:','https:'].includes(download.protocol)) return null;
    return { ...release, downloadUrl: download.href, notes: typeof release.notes === 'string' ? release.notes.slice(0,1000) : '' };
  } catch { return null; }
}
