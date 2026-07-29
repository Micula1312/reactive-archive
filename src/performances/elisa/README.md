# Elisa — media manifest

Inserire i file video in `public/elisa/videos/` usando questi nomi:

1. `01-orologio-face-id.mp4`
3. `03-loader.mp4`
4. `04-video-verticale.mp4`
6. `06-foto.mp4`
7. `07-3d-touch.mp4`
8. `08-rotazione.mp4`
10. `10-foresta-numeri.mp4`
11. `11-foresta-immagini.mp4`
12. `12-archivio-3d.mp4`
14. `14-drum.mp4`
15. `15-volto-copri.mp4`
16. `16-cacofonia.mp4`
18. `18-ex-albero.mp4`
19. `19-orologio.mp4`
20. `20-blivet.mp4`

Le cue Hydra sono già collegate ai moduli `genesis`, `apparition`, `resonance`, `hypnosis`, `crossing` e `farewell`.

Le scene indicate come Archivio restano tecnicamente `video` per essere compatibili con il motore attuale, ma conservano `dramaturgicalType: "archive"` nel JSON.

Per rendere Elisa la performance attiva, in `src/scripts/Performance.js` importare ed esportare `../performances/elisa/index.js`.