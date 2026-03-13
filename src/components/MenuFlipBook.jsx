import React, { useCallback, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page" ref={ref}>
      <div className="page-content h-full w-full bg-white dark:bg-zinc-800 shadow-xl overflow-hidden">
        {props.children}
      </div>
    </div>
  );
});

const MenuFlipBook = () => {
  const bookRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);

  const menuImages = [
    '/assets/menu/1.png',
    '/assets/menu/2.png',
    '/assets/menu/3.png',
    '/assets/menu/4.png'
  ];

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
  }, []);

  const prevPage = () => {
    bookRef.current.pageFlip().flipPrev();
  };

  const nextPage = () => {
    bookRef.current.pageFlip().flipNext();
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="relative w-full flex items-center justify-center py-4">
        <HTMLFlipBook
          width={500}
          height={700}
          size="stretch"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport={true}
          onFlip={onFlip}
          className="menu-flipbook mx-auto"
          ref={bookRef}
        >
          {menuImages.map((src, index) => (
            <Page key={index}>
              <img 
                src={src} 
                alt={`Menu Page ${index + 1}`} 
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </Page>
          ))}
        </HTMLFlipBook>
      </div>
      
      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center gap-8">
        <button 
          onClick={prevPage}
          className="p-3 rounded-full bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-primary transition-all shadow-md group border border-primary/20 dark:border-secondary/20"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-6 h-6 group-active:scale-95" />
        </button>
        
        <div className="flex items-center gap-2">
          {menuImages.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentPage === i ? 'w-6 bg-secondary' : 'w-1.5 bg-gray-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={nextPage}
          className="p-3 rounded-full bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-primary transition-all shadow-md group border border-primary/20 dark:border-secondary/20"
          aria-label="Next Page"
        >
          <ChevronRight className="w-6 h-6 group-active:scale-95" />
        </button>
      </div>

      <p className="mt-4 text-sm text-text dark:text-gray-400 italic">
        Tip: You can also drag the corners to flip pages
      </p>
    </div>
  );
};

export default MenuFlipBook;
