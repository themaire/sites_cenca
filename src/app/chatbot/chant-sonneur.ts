/** Un ton au-dessus de la note d'origine (540 → 500 Hz). */
const TON = Math.pow(2, 2 / 12);
const FREQUENCE_DEPART = 540 * TON;
const FREQUENCE_FIN = 500 * TON;

/** Motif « hou-hou » joué trois fois. */
const REPETITIONS = 3;
const ECART_HOU = 0.42;
const ECART_MOTIF = 1.1;

/**
 * Chant de Sonneur : signale qu'une réponse est prête.
 *
 * Imite, sans fichier audio, l'appel du sonneur à ventre jaune : un « hou » doux et bref,
 * entre le bip et la note flûtée, répété deux fois ; ce motif est joué trois fois.
 * Synthèse Web Audio : une sinusoïde légèrement descendante, une pointe d'harmonique
 * pour le côté « bip », adoucie par un filtre passe-bas.
 */
export class ChantSonneur {
  private contexte: AudioContext | null = null;

  /**
   * À appeler lors d'un geste de l'utilisateur (envoi d'une question, clic) :
   * les navigateurs bloquent le son tant que la page n'a pas reçu d'interaction.
   */
  preparer(): void {
    try {
      this.contexte ??= new AudioContext();
      if (this.contexte.state === 'suspended') {
        void this.contexte.resume();
      }
    } catch {
      // Web Audio indisponible : Sonneur restera muet
      this.contexte = null;
    }
  }

  jouer(): void {
    if (!this.contexte) return;
    const debut = this.contexte.currentTime + 0.05;
    for (let motif = 0; motif < REPETITIONS; motif++) {
      const debutMotif = debut + motif * ECART_MOTIF;
      this.note(debutMotif, FREQUENCE_DEPART, FREQUENCE_FIN);
      this.note(debutMotif + ECART_HOU, FREQUENCE_DEPART, FREQUENCE_FIN);
    }
  }

  private note(debut: number, frequenceDepart: number, frequenceFin: number): void {
    const contexte = this.contexte!;
    const duree = 0.26;

    const filtre = contexte.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 1400;

    // Enveloppe : attaque douce, extinction rapide (note timide)
    const volume = contexte.createGain();
    volume.gain.setValueAtTime(0.0001, debut);
    volume.gain.exponentialRampToValueAtTime(0.16, debut + 0.035);
    volume.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    filtre.connect(volume).connect(contexte.destination);

    // Fondamentale (le « hou ») et harmonique discrète (le « bip »)
    for (const [multiple, niveau] of [[1, 1], [2, 0.18]] as const) {
      const oscillateur = contexte.createOscillator();
      oscillateur.type = 'sine';
      oscillateur.frequency.setValueAtTime(frequenceDepart * multiple, debut);
      oscillateur.frequency.exponentialRampToValueAtTime(frequenceFin * multiple, debut + duree);

      const gain = contexte.createGain();
      gain.gain.value = niveau;
      oscillateur.connect(gain).connect(filtre);
      oscillateur.start(debut);
      oscillateur.stop(debut + duree + 0.02);
    }
  }

  fermer(): void {
    void this.contexte?.close();
    this.contexte = null;
  }
}
