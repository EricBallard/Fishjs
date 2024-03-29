export function getStringPaths(skybox) {
  const baseFilename = skybox ? './js/_resources/skybox/uw_' : './js/_resources/particles/particle_';
  
  //const baseFilename = skybox
  //  ? 'https://storage.googleapis.com/fishjs_bucket/skybox/uw_'
  //  : '/_resources/particles/particle_'

  const sides = skybox ? ['ft', 'bk', 'up', 'dn', 'rt', 'lf'] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const pathStings = sides.map(side => baseFilename + side + (skybox ? '.jpg' : '.png'))
  return pathStings
}
