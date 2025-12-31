
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogState, Season, Product, Category } from './types';
import { INITIAL_STATE } from './constants';
import { Search, Plus, Save, Settings, Eye, Edit2, X, Download, Camera, Image as ImageIcon, Send, Calculator } from 'lucide-react';

// --- Utility Components ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400"/></button>
        </div>
        <div className="p-6 overflow-y-auto scroll-hide flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Helper Functions ---
const calculateFinalPrice = (base: number, discount: number) => {
  return base - (base * (discount / 100));
};

const formatCurrency = (val: number) => {
  return `S/ ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<CatalogState>(() => {
    const saved = localStorage.getItem('catalogo_pro_data_v4');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [isAdminActive, setIsAdminActive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  // Modals state
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Current editing context
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('catalogo_pro_data_v4', JSON.stringify(state));
  }, [state]);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setIsAdminActive(true);
      setLogoClicks(0);
      alert("🔐 Panel administrativo activado.");
    }
  };

  const currentCategories = useMemo(() => {
    return state[state.season];
  }, [state]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return currentCategories;
    const query = searchQuery.toLowerCase();
    return currentCategories.map(cat => ({
      ...cat,
      products: cat.products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      )
    })).filter(cat => cat.products.length > 0);
  }, [currentCategories, searchQuery]);

  // --- Actions ---

  const updateState = (updater: (prev: CatalogState) => CatalogState) => {
    setState(prev => updater(prev));
  };

  const switchSeason = (season: Season) => {
    updateState(prev => ({ ...prev, season }));
  };

  const sendWhatsApp = (product: Product) => {
    const finalPrice = calculateFinalPrice(product.basePrice, product.discountValue);
    const msg = `Hola! 👋 Me interesa este producto: *${product.name}* que tiene un precio de *${formatCurrency(finalPrice)}*. ¿Tienen disponibilidad?`;
    const url = `https://wa.me/${state.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const exportCatalog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "catalogo_backup.json");
    dlAnchorElem.click();
  };

  const addNewCategory = () => {
    const id = `cat_${Date.now()}`;
    updateState(prev => ({
      ...prev,
      [prev.season]: [...prev[prev.season], {
        id,
        name: "NUEVA CATEGORÍA",
        icon: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png",
        products: []
      }]
    }));
  };

  const deleteCategory = (id: string) => {
    if(!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    updateState(prev => ({
      ...prev,
      [prev.season]: prev[prev.season].filter(c => c.id !== id)
    }));
    setIsCategoryModalOpen(false);
  };

  const addNewProduct = (catId: string) => {
    const id = `prod_${Date.now()}`;
    const newProduct: Product = {
      id,
      name: "Nuevo Producto",
      description: "Descripción breve del producto...",
      basePrice: 0,
      hasDiscount: false,
      discountValue: 0,
      thumb: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop"
    };

    updateState(prev => ({
      ...prev,
      [prev.season]: prev[prev.season].map(cat => 
        cat.id === catId ? { ...cat, products: [...cat.products, newProduct] } : cat
      )
    }));

    setActiveCategoryId(catId);
    setActiveProductId(id);
    setIsProductModalOpen(true);
  };

  const deleteProduct = (catId: string, prodId: string) => {
    if(!confirm("¿Deseas eliminar este producto?")) return;
    updateState(prev => ({
      ...prev,
      [prev.season]: prev[prev.season].map(cat => 
        cat.id === catId ? { ...cat, products: cat.products.filter(p => p.id !== prodId) } : cat
      )
    }));
    setIsProductModalOpen(false);
  };

  const editingProduct = useMemo(() => {
    if (!activeCategoryId || !activeProductId) return null;
    return currentCategories.find(c => c.id === activeCategoryId)?.products.find(p => p.id === activeProductId) || null;
  }, [activeCategoryId, activeProductId, currentCategories]);

  const seasonStyles = state.season === Season.WINTER 
    ? "from-blue-600 to-indigo-900" 
    : "from-orange-500 to-red-600";

  return (
    <div className={`min-h-screen transition-all duration-700 bg-slate-100`}>
      {/* ADMIN PANEL BAR */}
      {isAdminActive && (
        <div className="fixed top-0 inset-x-0 z-[5000] bg-gray-900 text-white p-3 flex flex-wrap justify-center items-center gap-2 shadow-2xl border-b border-white/10 text-[10px] font-bold uppercase overflow-x-auto whitespace-nowrap">
          <button onClick={() => setIsEditMode(!isEditMode)} className={`${isEditMode ? 'bg-emerald-600' : 'bg-blue-600'} px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90`}>
            {isEditMode ? <Edit2 size={12}/> : <Eye size={12}/>} {isEditMode ? "Ver como Cliente" : "Modo Edición"}
          </button>
          <button onClick={() => setIsGlobalModalOpen(true)} className="bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <Settings size={12}/> Config
          </button>
          <button onClick={addNewCategory} className="bg-purple-600 px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={12}/> Categoría
          </button>
          <button onClick={exportCatalog} className="bg-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
            <Download size={12}/> Exportar
          </button>
          <button onClick={() => setIsAdminActive(false)} className="bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2">
            <X size={12}/> Salir Admin
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className={`relative pt-16 pb-20 text-center text-white overflow-hidden rounded-b-[4rem] shadow-2xl bg-gradient-to-br ${seasonStyles}`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="relative z-10 container mx-auto px-6">
          <div onClick={handleLogoClick} className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl p-3 shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer relative group">
            <img src={state.logo} alt="Logo" className="w-full h-full object-contain" />
            {isEditMode && <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100"><Camera size={20}/></div>}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">{state.title}</h1>
          <p className="text-lg opacity-80 italic font-medium">{state.subtitle}</p>
        </div>
      </header>

      {/* CONTROLS */}
      <div className="max-w-xl mx-auto px-6 -mt-10 relative z-30 space-y-4">
        <div className="bg-white p-1.5 rounded-[2rem] shadow-xl flex gap-1 border-4 border-white">
          <button onClick={() => switchSeason(Season.WINTER)} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-sm transition-all ${state.season === Season.WINTER ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>❄️ Invierno</button>
          <button onClick={() => switchSeason(Season.SUMMER)} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-sm transition-all ${state.season === Season.SUMMER ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>☀️ Verano</button>
        </div>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={20}/>
          <input type="text" placeholder="Buscar productos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white shadow-lg outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"/>
        </div>
      </div>

      {/* QUICK NAV */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 mt-8 mb-4">
        <div className="container mx-auto flex gap-8 px-6 py-4 overflow-x-auto scroll-hide">
          {currentCategories.map(cat => (
            <a key={cat.id} href={`#${cat.id}`} className="flex flex-col items-center gap-2 min-w-fit group">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center p-3 group-hover:scale-110 group-hover:bg-white transition-all">
                <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-900 tracking-wider whitespace-nowrap">{cat.name}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main className="container mx-auto px-4 pb-32 space-y-16">
        {filteredCategories.map(cat => (
          <section key={cat.id} id={cat.id} className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className={`w-2 h-8 rounded-full ${state.season === Season.WINTER ? 'bg-blue-600' : 'bg-orange-600'}`}></div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                {cat.name}
                {isEditMode && (
                  <button onClick={() => { setActiveCategoryId(cat.id); setIsCategoryModalOpen(true); }} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:text-blue-600 transition-colors"><Edit2 size={14}/></button>
                )}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {cat.products.map(prod => {
                const finalPrice = calculateFinalPrice(prod.basePrice, prod.discountValue);
                return (
                  <div key={prod.id} className="group relative flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-100">
                    <div className="relative aspect-[4/5] overflow-hidden cursor-pointer" onClick={() => setZoomImg(prod.thumb)}>
                      {prod.hasDiscount && (
                        <div className="absolute top-4 right-4 bg-[#EF4444] text-white text-[11px] font-black px-3 py-1.5 rounded-full z-10 shadow-lg animate-pulse">- {prod.discountValue}%</div>
                      )}
                      <img src={prod.thumb} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      {isEditMode && (
                        <button onClick={(e) => { e.stopPropagation(); setActiveCategoryId(cat.id); setActiveProductId(prod.id); setIsProductModalOpen(true); }} className="absolute top-4 left-4 p-2.5 bg-black/60 text-white rounded-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20"><Edit2 size={16}/></button>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2">{prod.name}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">{prod.description}</p>
                      <div className="mt-auto space-y-4">
                        <div className="flex flex-col">
                          {prod.hasDiscount && (
                            <span className="text-sm text-[#EF4444] font-bold line-through decoration-[#EF4444]/50">S/ {prod.basePrice}</span>
                          )}
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(finalPrice)}</span>
                        </div>
                        <button onClick={() => sendWhatsApp(prod)} className="w-full py-4 bg-[#22C55E] rounded-2xl flex items-center justify-center gap-2 text-white text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all">
                          <Send size={16} fill="white"/> {state.wsText}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* BOTÓN "+" DINÁMICO (ESTILO DIBUJO) */}
              {isEditMode && (
                <button 
                  onClick={() => addNewProduct(cat.id)}
                  className="group relative flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-[3px] border-dashed border-[#60A5FA]/40 hover:border-[#60A5FA] hover:bg-blue-50/40 transition-all cursor-pointer aspect-[4/5] shadow-sm hover:shadow-xl active:scale-95 overflow-hidden"
                >
                  <div className="flex items-center justify-center">
                    <Plus size={120} className="text-[#60A5FA] font-thin opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" strokeWidth={0.5}/>
                  </div>
                  <span className="absolute bottom-10 text-[10px] font-black text-[#60A5FA] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">Nuevo Producto</span>
                </button>
              )}
            </div>
          </section>
        ))}
      </main>

      {/* MODALS */}
      {zoomImg && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-in zoom-in duration-300" onClick={() => setZoomImg(null)}>
          <img src={zoomImg} className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl" alt="Zoomed" />
          <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
        </div>
      )}

      {/* MODAL CONFIG GLOBAL */}
      <Modal isOpen={isGlobalModalOpen} onClose={() => setIsGlobalModalOpen(false)} title="Configuración Global">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">Nombre de la Tienda</label>
            <input type="text" value={state.title} onChange={(e) => updateState(prev => ({...prev, title: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"/>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">Eslogan</label>
            <input type="text" value={state.subtitle} onChange={(e) => updateState(prev => ({...prev, subtitle: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">WhatsApp</label>
              <input type="text" value={state.whatsapp} onChange={(e) => updateState(prev => ({...prev, whatsapp: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Color Botón</label>
              <input type="color" value={state.wsColor} onChange={(e) => updateState(prev => ({...prev, wsColor: e.target.value}))} className="w-full h-14 rounded-2xl cursor-pointer border-2 border-slate-100"/>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">Texto Botón</label>
            <input type="text" value={state.wsText} onChange={(e) => updateState(prev => ({...prev, wsText: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase">URL Logo</label>
            <input type="text" value={state.logo} onChange={(e) => updateState(prev => ({...prev, logo: e.target.value}))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
          </div>
          <button onClick={() => setIsGlobalModalOpen(false)} className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl">Guardar Cambios</button>
        </div>
      </Modal>

      {/* MODAL CATEGORIA */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Editar Categoría">
        {activeCategoryId && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Nombre</label>
              <input type="text" value={currentCategories.find(c => c.id === activeCategoryId)?.name || ''} onChange={(e) => updateState(prev => ({
                ...prev, [prev.season]: prev[prev.season].map(c => c.id === activeCategoryId ? {...c, name: e.target.value.toUpperCase()} : c)
              }))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"/>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">URL Icono</label>
              <input type="text" value={currentCategories.find(c => c.id === activeCategoryId)?.icon || ''} onChange={(e) => updateState(prev => ({
                ...prev, [prev.season]: prev[prev.season].map(c => c.id === activeCategoryId ? {...c, icon: e.target.value} : c)
              }))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => deleteCategory(activeCategoryId)} className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-xs">Eliminar</button>
              <button onClick={() => setIsCategoryModalOpen(false)} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs">Listo</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL PRODUCTO / CALCULADORA */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Editor de Producto">
        {editingProduct && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Título del Producto</label>
              <input type="text" value={editingProduct.name} onChange={(e) => updateState(prev => ({
                ...prev, [prev.season]: prev[prev.season].map(cat => cat.id === activeCategoryId ? {
                  ...cat, products: cat.products.map(p => p.id === activeProductId ? {...p, name: e.target.value} : p)
                } : cat)
              }))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"/>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Imagen URL (Cambiar Foto)</label>
              <input type="text" value={editingProduct.thumb} onChange={(e) => updateState(prev => ({
                ...prev, [prev.season]: prev[prev.season].map(cat => cat.id === activeCategoryId ? {
                  ...cat, products: cat.products.map(p => p.id === activeProductId ? {...p, thumb: e.target.value} : p)
                } : cat)
              }))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"/>
            </div>

            <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Calculator size={16}/> <span className="text-[10px] font-black uppercase">Calculadora Automática</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase">Precio Base (S/)</label>
                  <input type="number" value={editingProduct.basePrice} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateState(prev => ({
                      ...prev, [prev.season]: prev[prev.season].map(cat => cat.id === activeCategoryId ? {
                        ...cat, products: cat.products.map(p => p.id === activeProductId ? {...p, basePrice: val} : p)
                      } : cat)
                    }));
                  }} className="w-full p-4 rounded-xl bg-white border-2 border-blue-200 outline-none font-bold"/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase">Descuento (%)</label>
                  <input type="number" value={editingProduct.discountValue} onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updateState(prev => ({
                      ...prev, [prev.season]: prev[prev.season].map(cat => cat.id === activeCategoryId ? {
                        ...cat, products: cat.products.map(p => p.id === activeProductId ? {...p, discountValue: val, hasDiscount: val > 0} : p)
                      } : cat)
                    }));
                  }} className="w-full p-4 rounded-xl bg-white border-2 border-blue-200 outline-none font-bold text-red-500"/>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black text-blue-400 uppercase">Precio Final Calculado:</span>
                <span className="text-2xl font-black text-blue-700">{formatCurrency(calculateFinalPrice(editingProduct.basePrice, editingProduct.discountValue))}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase">Descripción</label>
              <textarea value={editingProduct.description} onChange={(e) => updateState(prev => ({
                ...prev, [prev.season]: prev[prev.season].map(cat => cat.id === activeCategoryId ? {
                  ...cat, products: cat.products.map(p => p.id === activeProductId ? {...p, description: e.target.value} : p)
                } : cat)
              }))} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all h-24 text-sm"/>
            </div>

            <div className="flex gap-4">
              <button onClick={() => deleteProduct(activeCategoryId!, activeProductId!)} className="flex-1 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-xs">Eliminar</button>
              <button onClick={() => setIsProductModalOpen(false)} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs shadow-lg">Guardar Producto</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
