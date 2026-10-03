import { useState } from 'react'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
        {images.map((img, i) => (
          <button
            key={img}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={active === i}
            className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 sm:h-20 sm:w-16 ${
              active === i ? 'border-brand-primary' : 'border-transparent'
            }`}
          >
            <img src={img} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden rounded-lg bg-brand-light">
        <img
          src={images[active]}
          alt={name}
          className="aspect-[3/4] w-full object-cover transition-transform duration-300 hover:scale-105 sm:aspect-square"
        />
      </div>
    </div>
  )
}
