import { TempsEcoulePipe } from './temps-ecoule.pipe';

describe('TempsEcoulePipe', () => {
  const pipe = new TempsEcoulePipe();
  const maintenant = new Date(2026, 9, 2, 12, 0, 0);
  const avant = (minutes: number) => new Date(maintenant.getTime() - minutes * 60000);

  it('formate les durées relatives', () => {
    expect(pipe.transform(avant(0), maintenant)).toBe("à l'instant");
    expect(pipe.transform(avant(5), maintenant)).toBe('il y a 5 min');
    expect(pipe.transform(avant(180), maintenant)).toBe('il y a 3 h');
    expect(pipe.transform(avant(24 * 60), maintenant)).toBe('hier');
    expect(pipe.transform(avant(4 * 24 * 60), maintenant)).toBe('il y a 4 j');
  });

  it('affiche la date au-delà d\'une semaine et ignore les valeurs invalides', () => {
    expect(pipe.transform(new Date(2026, 8, 1), maintenant)).toBe('01/09/2026');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('pas une date')).toBe('');
  });
});
