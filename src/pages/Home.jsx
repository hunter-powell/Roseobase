import React from 'react'
import { NavLink } from 'react-router-dom'

// Define the order of images (by filename) - modify this array to change the order
const logoOrder = [
  'simons-foundation.jpeg',
  'rosebase-logo.jpeg',
  'NSF.jpeg',
  'UGA.jpeg'
]

// Load all images into an object keyed by filename
const logoImagesMap = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/footer-logos/*.{png,jpg,jpeg,svg,gif,webp}', {
      eager: true,
      import: 'default'
    })
  ).map(([path, module]) => {
    const filename = path.split('/').pop()
    return [filename, module]
  })
)

// Get images in the specified order, then append any remaining images
const orderedImages = logoOrder
  .map(filename => logoImagesMap[filename])
  .filter(Boolean) // Remove any undefined entries if a file doesn't exist

const remainingImages = Object.entries(logoImagesMap)
  .filter(([filename]) => !logoOrder.includes(filename))
  .map(([, module]) => module)

const logoImages = [...orderedImages, ...remainingImages]

// Bacteria PNGs for specific positions on the page.
// Drop your PNGs into `src/assets/bacteria` with these exact names:
// - hero-left.png
// - hero-right.png
// - cluster-1.png ... cluster-5.png
// - bottom.png
const bacteriaImageMap = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/bacteria/*.{png,jpg,jpeg,svg,gif,webp}', {
      eager: true,
      import: 'default'
    })
  ).map(([path, module]) => {
    const filename = path.split('/').pop()
    return [filename, module]
  })
)

const getBacteriaImage = name => bacteriaImageMap[name]

const Home = () => {
  const hasLogos = logoImages.length > 0

  return (
    <div className='home-page'>
      <div className='home-hero-illustrations'>
        {getBacteriaImage('cluster-1.png') && (
          <img
            src={getBacteriaImage('cluster-1.png')}
            alt=''
            className='home-bacteria-image top-left'
          />
        )}
        {getBacteriaImage('cluster-2.png') && (
          <img
            src={getBacteriaImage('cluster-2.png')}
            alt=''
            className='home-bacteria-image top-right'
          />
        )}
      </div>

      <header className='home-hero'>
        <h1 className='home-title'>Roseobase</h1>
        <p className='home-subtitle'>A Genomic Resource for Marine Roseobacteraceae</p>
      </header>

      <nav className='home-nav'>
        <NavLink to='/genomes'>Genomes</NavLink>
        <NavLink to='/blast'>BLAST</NavLink>
        <NavLink to='/jbrowse'>JBrowse</NavLink>
      </nav>

      <div className='home-text'>
        <p className='home-paragraph'>
          Roseobacteraceae are abundant members of bacterial communities in coastal and open oceans,
          marine sediments, polar waters, and sea ice. Many bacteria in this group have large (&gt;4 Mb)
          genomes, and can be readily cultured. Amenable to physiological and genetic analyses in the
          laboratory, these strains are important as model organisms for understanding marine biogeochemical
          cycles and microbial species interactions. Other members of this group have small genomes (&lt;2.5 Mb)
          and remain uncultured.
        </p>

        <p className='home-bold'>Roseobase is a genomic resource for Roseobacter genomes</p>

        <p className='home-paragraph'>
          There are currently{' '}
          <NavLink to='/genomes' className='home-link'>
            Roseobacteraceae genomes
          </NavLink>{' '}
          available for BLAST and browsing
        </p>


        <div className='home-contacts'>
          <div className='home-contact'>
            <span>Christa B. Smith</span>{' '}
            <span>cbs649@uga.edu</span>
          </div>
          <div className='home-contact'>
            <span>Mary Ann Moran</span>{' '}
            <span>mmoran@uga.edu</span>
          </div>
        </div>
      </div>

      {getBacteriaImage('cluster-3.png') && (
        <div className='home-cluster-left'>
          <img
            src={getBacteriaImage('cluster-3.png')}
            alt=''
            className='cluster-item cluster-image cluster-left'
          />
        </div>
      )}

      <div className='home-cluster'>
        {getBacteriaImage('cluster-5.png') && (
          <img
            src={getBacteriaImage('cluster-5.png')}
            alt=''
            className='cluster-item cluster-image cluster-2'
          />
        )}
        {getBacteriaImage('cluster-7.png') && (
          <img
            src={getBacteriaImage('cluster-7.png')}
            alt=''
            className='cluster-item cluster-image cluster-4'
          />
        )}
      </div>

      <div className='home-bottom-floater'>
        {getBacteriaImage('cluster-7.png') && (
          <img
            src={getBacteriaImage('cluster-7.png')}
            alt=''
            className='home-bacteria-image bottom-image'
          />
        )}
      </div>

      <footer className='home-footer'>
        {hasLogos ? (
          <div className='home-footer-logos'>
            {logoImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                className='home-footer-logo'
                alt='Footer logo'
                loading='lazy'
              />
            ))}
            <div className='home-footer-text-block'>
              <div className='home-footer-text-line1'>University of Georgia</div>
              <div className='home-footer-text-line2'>Department of Marine Sciences</div>
            </div>
          </div>
        ) : (
          <>
            <div className='home-logo-simons'>SIMONS FOUNDATION</div>
            <div className='home-badge marine' aria-hidden='true' />
            <div className='home-badge nsf' aria-hidden='true'>
              NSF
            </div>
            <div className='home-uga-shield' aria-hidden='true' />
            <div className='home-footer-text'>University of Georgia Department of Marine Sciences</div>
          </>
        )}
      </footer>
    </div>
  )
}

export default Home
