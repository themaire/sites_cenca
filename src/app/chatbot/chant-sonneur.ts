/*
 * Valeurs mesurées sur Bombina variegata (fréquence dominante ≈ 1213 Hz, chant ≈ 192 ms,
 * ≈ 1,6 chant par seconde ; cf. Schneider et al. 1986 : 1100–2500 Hz, 164–260 ms).
 */
const FREQUENCE_DEPART = 1240;
const FREQUENCE_FIN = 1190;
const DUREE_HOU = 0.192;

/** Motif « hou-hou » joué trois fois, au rythme naturel : une série régulière de 6 chants. */
const REPETITIONS = 3;
const ECART_HOU = 1 / 1.6;
const ECART_MOTIF = 2 * ECART_HOU;

/**
 * Chant de Sonneur : signale qu'une réponse est prête.
 *
 * Imite, sans fichier audio, l'appel du sonneur à ventre jaune d'après les mesures
 * bioacoustiques : un « hou » doux et bref, entre le bip et la note flûtée, en série régulière.
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
    const duree = DUREE_HOU;

    const filtre = contexte.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 2800;

    // Enveloppe : attaque douce, extinction rapide (note timide)
    const volume = contexte.createGain();
    volume.gain.setValueAtTime(0.0001, debut);
    // Plus discret qu'en grave : l'oreille perçoit plus fort vers 1 kHz
    volume.gain.exponentialRampToValueAtTime(0.12, debut + 0.03);
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
