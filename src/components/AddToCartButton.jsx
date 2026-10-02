import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const AddToCartButton = ({ item, size = 'large' }) => {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const buttonRef = useRef(null);
  const halfBtnRef = useRef(null);
  const fullBtnRef = useRef(null);

  const isSmall = size === 'small';

  const hasHalfFull = Boolean(
    item?.hasHalfFull ||
    (item?.priceHalf && item?.priceFull) ||
    (item?.halfPrice && item?.fullPrice)
  );

  const halfPrice = item?.priceHalf || item?.halfPrice;
  const fullPrice = item?.priceFull || item?.fullPrice || item?.price;

  // Single portion item (standard)
  const cartItem = cartItems.find(i => i.id === item?.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Half & Full variant items
  const baseId = item?.id || item?.name || item?.title || 'item';
  const halfId = `${baseId}_half`;
  const fullId = `${baseId}_full`;

  const halfCartItem = cartItems.find(i =>
    i.id === halfId || (i.parentItemId === item?.id && i.portion === 'Half') || (i.name === `${item?.name || item?.title} (Half)`)
  );
  const halfQty = halfCartItem ? halfCartItem.quantity : 0;

  const fullCartItem = cartItems.find(i =>
    i.id === fullId || (i.parentItemId === item?.id && i.portion === 'Full') || (i.name === `${item?.name || item?.title} (Full)`)
  );
  const fullQty = fullCartItem ? fullCartItem.quantity : 0;

  // Handlers for single portion item
  const handleAdd = (e) => {
    e?.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    addToCart(item, rect);
  };

  const handleRemove = (e) => {
    e?.stopPropagation();
    removeFromCart(item.id);
  };

  // Handlers for Half portion
  const handleAddHalf = (e) => {
    e?.stopPropagation();
    const rect = halfBtnRef.current?.getBoundingClientRect() || buttonRef.current?.getBoundingClientRect();
    const itemToAdd = {
      ...item,
      id: halfId,
      parentItemId: item.id,
      name: `${item.name || item.title} (Half)`,
      title: `${item.name || item.title} (Half)`,
      portion: 'Half',
      price: halfPrice || item.price,
    };
    addToCart(itemToAdd, rect);
  };

  const handleRemoveHalf = (e) => {
    e?.stopPropagation();
    removeFromCart(halfCartItem ? halfCartItem.id : halfId);
  };

  // Handlers for Full portion
  const handleAddFull = (e) => {
    e?.stopPropagation();
    const rect = fullBtnRef.current?.getBoundingClientRect() || buttonRef.current?.getBoundingClientRect();
    const itemToAdd = {
      ...item,
      id: fullId,
      parentItemId: item.id,
      name: `${item.name || item.title} (Full)`,
      title: `${item.name || item.title} (Full)`,
      portion: 'Full',
      price: fullPrice || item.price,
    };
    addToCart(itemToAdd, rect);
  };

  const handleRemoveFull = (e) => {
    e?.stopPropagation();
    removeFromCart(fullCartItem ? fullCartItem.id : fullId);
  };

  // RENDER DUAL BUTTONS FOR ITEMS WITH HALF & FULL OPTIONS
  if (hasHalfFull) {
    return (
      <div
        ref={buttonRef}
        className={`relative flex items-center justify-center gap-1 sm:gap-1.5 ${
          isSmall ? 'w-full max-w-[130px] sm:max-w-[150px] h-8' : 'w-full h-11 sm:h-12'
        }`}
      >
        {/* HALF BUTTON */}
        <div ref={halfBtnRef} className="flex-1 h-full min-w-0">
          <AnimatePresence mode="wait">
            {halfQty === 0 ? (
              <motion.button
                key="half-add-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleAddHalf}
                title={`Add Half (${halfPrice || item.price})`}
                className={`w-full h-full bg-white dark:bg-zinc-100 text-secondary font-bold rounded-lg shadow-sm border border-secondary/20 hover:border-secondary hover:shadow hover:bg-secondary/5 transition-all duration-200 flex items-center justify-center ${
                  isSmall ? 'text-[11px] px-1' : 'text-xs sm:text-sm px-2 gap-1'
                }`}
              >
                <span>Half</span>
                {!isSmall && halfPrice && (
                  <span className="text-[11px] sm:text-xs text-gray-500 font-semibold">{halfPrice}</span>
                )}
              </motion.button>
            ) : (
              <motion.div
                key="half-qty-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full h-full bg-white dark:bg-zinc-100 flex items-center justify-between rounded-lg shadow-sm border border-secondary/25 ${
                  isSmall ? 'px-0.5 sm:px-1' : 'px-2'
                }`}
              >
                <button
                  onClick={handleRemoveHalf}
                  className="p-0.5 sm:p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                  title="Decrease Half"
                >
                  <Minus size={isSmall ? 10 : 15} strokeWidth={3} />
                </button>
                <div className="flex flex-col items-center justify-center leading-none px-0.5">
                  <span className={`text-secondary font-extrabold ${isSmall ? 'text-[11px]' : 'text-sm'}`}>
                    {halfQty}
                  </span>
                  <span className={`text-gray-500 uppercase font-bold tracking-tighter ${
                    isSmall ? 'text-[7px]' : 'text-[9px]'
                  }`}>
                    Half
                  </span>
                </div>
                <button
                  onClick={handleAddHalf}
                  className="p-0.5 sm:p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                  title="Increase Half"
                >
                  <Plus size={isSmall ? 10 : 15} strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FULL BUTTON (BESIDE HALF BUTTON) */}
        <div ref={fullBtnRef} className="flex-1 h-full min-w-0">
          <AnimatePresence mode="wait">
            {fullQty === 0 ? (
              <motion.button
                key="full-add-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleAddFull}
                title={`Add Full (${fullPrice || item.price})`}
                className={`w-full h-full bg-white dark:bg-zinc-100 text-secondary font-bold rounded-lg shadow-sm border border-secondary/20 hover:border-secondary hover:shadow hover:bg-secondary/5 transition-all duration-200 flex items-center justify-center ${
                  isSmall ? 'text-[11px] px-1' : 'text-xs sm:text-sm px-2 gap-1'
                }`}
              >
                <span>Full</span>
                {!isSmall && fullPrice && (
                  <span className="text-[11px] sm:text-xs text-gray-500 font-semibold">{fullPrice}</span>
                )}
              </motion.button>
            ) : (
              <motion.div
                key="full-qty-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full h-full bg-white dark:bg-zinc-100 flex items-center justify-between rounded-lg shadow-sm border border-secondary/25 ${
                  isSmall ? 'px-0.5 sm:px-1' : 'px-2'
                }`}
              >
                <button
                  onClick={handleRemoveFull}
                  className="p-0.5 sm:p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                  title="Decrease Full"
                >
                  <Minus size={isSmall ? 10 : 15} strokeWidth={3} />
                </button>
                <div className="flex flex-col items-center justify-center leading-none px-0.5">
                  <span className={`text-secondary font-extrabold ${isSmall ? 'text-[11px]' : 'text-sm'}`}>
                    {fullQty}
                  </span>
                  <span className={`text-gray-500 uppercase font-bold tracking-tighter ${
                    isSmall ? 'text-[7px]' : 'text-[9px]'
                  }`}>
                    Full
                  </span>
                </div>
                <button
                  onClick={handleAddFull}
                  className="p-0.5 sm:p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                  title="Increase Full"
                >
                  <Plus size={isSmall ? 10 : 15} strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // RENDER STANDARD SINGLE ADD BUTTON FOR REGULAR ITEMS
  return (
    <div className={`relative ${isSmall ? 'w-24 h-8' : 'w-full h-12'}`} ref={buttonRef}>
      <AnimatePresence mode="wait">
        {quantity === 0 ? (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleAdd}
            className={`w-full h-full bg-white dark:bg-zinc-100 text-secondary font-bold rounded-lg shadow border border-secondary/10 hover:shadow-md transition-all duration-300 ${isSmall ? 'text-sm' : 'text-lg'}`}
          >
            ADD
          </motion.button>
        ) : (
          <motion.div
            key="quantity-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`w-full h-full bg-white dark:bg-zinc-100 flex items-center justify-between rounded-lg shadow border border-secondary/10 ${isSmall ? 'px-2' : 'px-4'}`}
          >
            <button 
              onClick={handleRemove}
              className="p-1 text-secondary hover:bg-secondary/10 rounded-md transition-colors"
            >
              <Minus size={isSmall ? 14 : 20} strokeWidth={3} />
            </button>
            <span className={`text-secondary font-bold text-center min-w-[12px] ${isSmall ? 'text-sm' : 'text-xl'}`}>
              {quantity}
            </span>
            <button 
              onClick={handleAdd}
              className="p-1 text-secondary hover:bg-secondary/10 rounded-md transition-colors"
            >
              <Plus size={isSmall ? 14 : 20} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddToCartButton;
