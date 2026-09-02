import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Trash2, Printer, Calendar, Tag, Box, Wallet, ImageIcon, Maximize2, Layers, Activity, X } from 'lucide-react';
import { articlesAPI } from '../../services/api';
import { MetricTile, InfoRow } from '../../components/ui/Card'; 
import { Button, ConfirmationModal, Loader, PageHeader } from '../../components/ui';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../../context/ConfigContext';

const ArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { config } = useConfig();
  const imageSrc = article?.image?.startsWith('data:') ? article.image : `http://localhost:5000/${article?.image}`;

  useEffect(() => {
    articlesAPI.getOne(id)
      .then(res => setArticle(res.data.data))
      .catch(() => navigate('/articles'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const stats = useMemo(() => {
    if (!article) return null;
    const cost = article.cost || article.total_cost || 0;
    const margin = article.sales_rate ? (((article.sales_rate - cost) / article.sales_rate) * 100).toFixed(1) : 0;
    return { margin, isLoss: margin < 0 };
  }, [article]);

  const handleDelete = async () => {
    try {
      await articlesAPI.delete(id);
      toast.success('Article deleted successfully');
      navigate('/articles');
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const hasAnyRates = article?.rates && article?.rates?.length > 0;

  if (loading) return <Loader size="lg" className="h-full" />;

  return (
    <div className="h-full flex flex-col gap-5"><div className="print-only font-sans">
        <div className="p-5 pb-3 border border-black rounded-xl bg-white">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-slate-400 pb-3 mb-4">
            <div>
              <h1 className="text-xl font-bold uppercase leading-none">Article Details</h1>
              <p className="text-[9px] font-medium text-slate-600 tracking-widest uppercase mt-1">
                {config.company.name} - Manufacturing Unit
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold leading-none">{article.article_no}</h2>
              <p className="text-[9px] font-medium uppercase text-slate-600">Unit: {article.unit || 0} pcs / pkt</p>
            </div>
          </div>

          {/* Metadata Grid (Inline Styles) */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="px-3 pt-2.5 pb-2 bg-slate-100 border border-slate-400 rounded-lg">
              <span className="block text-[8px] font-bold uppercase text-slate-600 leading-none">Category</span>
              <span className="text-[11px] font-semibold leading-none">{article.category}</span>
            </div>
            <div className="px-3 pt-2.5 pb-2 bg-slate-100 border border-slate-400 rounded-lg">
              <span className="block text-[8px] font-bold uppercase text-slate-600 leading-none">Season</span>
              <span className="text-[11px] font-semibold leading-none">{article.season}</span>
            </div>
            <div className="px-3 pt-2.5 pb-2 bg-slate-100 border border-slate-400 rounded-lg">
              <span className="block text-[8px] font-bold uppercase text-slate-600 leading-none">Ratio</span>
              <span className="text-[11px] font-semibold leading-none">{article.size}</span>
            </div>
            <div className="px-3 pt-2.5 pb-2 bg-slate-100 border border-slate-400 rounded-lg">
              <span className="block text-[8px] font-bold uppercase text-slate-600 leading-none">Lot Qty</span>
              <span className="text-[11px] font-semibold leading-none">{article.stock_pkt || article.quantity || 0} pkt</span>
            </div>
          </div>

          {/* Rates Table */}
          <table className="w-full mb-5 border-collapse">
            <thead>
              <tr className="text-white text-[9px] uppercase tracking-wider">
                <th className="px-3 py-2 bg-black rounded-s-md text-left">Description</th>
                <th className="px-3 py-2 bg-black rounded-e-md text-right">Price (PKR)</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {article.rates?.map((rate, i) => (
                <tr key={i} className="border-b border-slate-300">
                  <td className="px-3 py-1.5 font-bold uppercase text-slate-600 text-[8px]">{rate.description}</td>
                  <td className="px-3 py-1.5 text-right font-bold tracking-tight">Rs. {rate.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Box & Notes */}
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="border border-dashed border-slate-500 px-3.5 py-3 rounded-xl bg-slate-50">
              <h4 className="text-[9px] font-bold uppercase text-slate-600 mb-1">Market Pricing</h4>
              <div className="text-[11px] flex justify-between font-bold">
                <span>Costing:</span>
                <span>Rs. {(article.cost || article.total_cost || 0).toLocaleString()}</span>
              </div>
              <hr className='my-1 border-slate-300'/>
              <div className="text-[11px] flex justify-between font-bold">
                <span>Sale Price:</span>
                <span>Rs. {(article.sales_rate || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-1">
              <h4 className="text-[9px] font-bold uppercase text-slate-600 mb-0.5 underline">Notes</h4>
              <p className="text-[10px] text-slate-700 italic leading-tight line-clamp-3">
                {article.description || "No notes available."}
              </p>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="w-full mt-4 pt-2 border-t border-slate-400 text-center text-[8px] font-semibold tracking-wide text-slate-600">
            This is a system-generated document • GarmentsOS by SparkPair • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Top Navigation & Actions */}
      <PageHeader 
        title={article.article_no}
        subtitle={`${article.season} Collection`}
        badge={article.category}
        showBack={true}
        backPath="/articles"
        actions={
          <>
            <Button variant="ghost" size="sm" icon={Printer} onClick={() => window.print()}>Print</Button>
            <Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/articles/edit/${id}`)}>Edit</Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              icon={Trash2} 
              className="text-red-500 hover:bg-red-50"
              onClick={() => setDeleteModal(true)}
            >
              Delete
            </Button>
          </>
        }
      />
      
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col gap-5 overflow-scroll"
        >
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricTile label="Cost Price" value={`Rs. ${(article.cost || article.total_cost || 0).toLocaleString()}`} icon={Wallet} variant="warning" />
            <MetricTile label="Retail Price" value={`Rs. ${(article.sales_rate || 0).toLocaleString()}`} icon={Tag} variant="success" />
            <MetricTile 
              label="Profit Margin" 
              value={`${stats.margin}%`} 
              variant={stats.isLoss ? "danger" : "info"} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Image & Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              {/* Article Image Container */}
              <div onClick={() => article.image && setIsMaximized(true)} className="relative group overflow-hidden rounded-3xl bg-slate-100 border border-slate-200 aspect-[16/10] shadow-inner">
                {article.image ? (
                  <>
                    <img 
                      src={imageSrc} 
                      alt={article.article_no}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                      <div className="bg-slate-100 border border-slate-300 p-3 rounded-2xl shadow-xl">
                          <Maximize2 className="text-slate-500" size={20} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50">
                    <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center border border-slate-200">
                      <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-widest">No Image Uploaded</p>
                  </div>
                )}
              </div>

              {/* Detailed Costing Breakdown */}
              <section className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-7">
                  <h3 className="text-xl font-bold text-slate-900">Production Costing</h3>
                  {!hasAnyRates && (
                    <span className="px-3 py-1 bg-amber-100/80 text-amber-700 text-[11px] font-medium uppercase rounded-full border border-amber-300">
                      No Costs Assigned
                    </span>
                  )}
                </div>

                {hasAnyRates ? (
                  <div className="space-y-3">
                    {/* Total Row */}
                    <div className="flex justify-between items-center px-4 py-3.5 bg-slate-800 text-white rounded-xl mt-6">
                      <span className="text-sm font-bold uppercase tracking-wider">Total Production Cost</span>
                      <span className="text-xl font-black">Rs. {(article.cost || article.total_cost || 0).toLocaleString()}</span>
                    </div>

                    <hr className='border-slate-400' />

                    {article.rates.map((item, i) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center p-2 hover:bg-slate-100 transition-all duration-300 rounded-2xl border border-slate-300 hover:border-slate-400 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center group-hover:bg-white transition-all duration-300">
                            <span className="text-sm font-bold text-slate-500">{i + 1}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{item.description}</span>
                        </div>
                        <span className="text-base font-semibold text-slate-900 bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 group-hover:bg-white transition-all duration-300">
                          Rs. {item.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-100">
                    <div className="p-4 bg-white rounded-2xl border border-slate-300 mb-4">
                      <Activity className="text-slate-500" size={32} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 tracking-wide">No Financial Data Available</p>
                    <p className="text-xs text-slate-500 mt-1">Please add rate items to see the cost breakdown.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Sidebar Specs */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* Spec Sheet Card */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <h4 className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-6">Specification Sheet</h4>
                
                <div className="space-y-5">
                  <SidebarItem icon={Layers} label="Fabric Type" value={article.fabric_type} />
                  <SidebarItem icon={Box} label="Size Ratio" value={article.size} />
                  <SidebarItem icon={Calendar} label="Stock" value={`${article.stock_pkt || article.quantity || 0} pkt x ${article.unit || 0} pcs`} />
                  <SidebarItem icon={Calendar} label="Created On" value={new Date(article.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} />
                </div>
              </div>
              
              {/* Notes Section */}
              {article.description && (
                <div className="p-8 bg-amber-100/80 rounded-3xl border-2 border-amber-300 border-dashed relative">
                  <h4 className="text-[11px] font-bold uppercase text-amber-600 mb-4 tracking-widest flex items-center gap-2">
                    <Edit size={13} /> Designer Notes
                  </h4>
                  <p className="text-sm text-amber-700 leading-relaxed font-medium italic">
                    "{article.description}"
                  </p>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isMaximized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-800 flex flex-col overflow-hidden"
          >
            {/* Top Utility Bar */}
            <div className="flex justify-between items-center ps-6 p-4 bg-black/40 backdrop-blur-md z-50">
              <span className="text-white/70 text-xs font-bold tracking-widest uppercase">
                {article.article_no} — Inspection Mode
              </span>
              <button 
                onClick={() => setIsMaximized(false)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* The Practical Viewer */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-crosshair">
              <div 
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onMouseMove={(e) => {
                  if (e.currentTarget.firstChild) {
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    const x = ((e.pageX - left) / width) * 100;
                    const y = ((e.pageY - top) / height) * 100;
                    e.currentTarget.firstChild.style.transformOrigin = `${x}% ${y}%`;
                  }
                }}
              >
                <img 
                  src={imageSrc} 
                  alt="Product"
                  className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out hover:scale-[2.5]" 
                  // Hover karte hi 2.5 times zoom hoga aur mouse ke saath move karega
                />
              </div>
            </div>

            {/* Bottom Label */}
            <div className="p-4 bg-black/40 text-center">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Move mouse over image to inspect details • Click X to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Article"
        message={`Are you sure you want to delete ${article.article_no}? All costing history will be permanently erased.`}
        variant="danger"
      />
    </div>
  );
};

// Internal Components for cleaner code
const SidebarItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-300">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[11px] font-medium uppercase text-slate-400 tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-100 tracking-wider">{value || 'N/A'}</p>
    </div>
  </div>
);

const BreakdownGroup = ({ type, data }) => {
  const filtered = data.filter(i => i.category === type);
  
  // Specific Category Empty Logic
  if (!filtered.length) {
    return (
      <div className="group opacity-50">
        <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-5">
          <h4 className="font-bold text-slate-400 uppercase text-[11px] tracking-[0.2em]">{type}</h4>
          <span className="text-[10px] font-bold text-slate-300 italic">No entry</span>
        </div>
        <div className="h-10 border border-dashed border-slate-200 rounded-xl flex items-center justify-center">
            <span className="text-[10px] text-slate-300 font-medium tracking-wider">Empty Category</span>
        </div>
      </div>
    );
  }

  const total = filtered.reduce((acc, i) => acc + i.price, 0);

  return (
    <div className="group">
      <div className="flex justify-between items-end border-b border-slate-200 pb-3 mb-5">
        <h4 className="font-bold text-slate-400 uppercase text-[11px] tracking-[0.2em]">{type}</h4>
        <span className="text-sm font-black text-slate-900">Rs. {total.toLocaleString()}</span>
      </div>
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <div key={i} className="flex justify-between items-center hover:translate-x-1 transition-all duration-300 group-hover:bg-slate-100/70 group-hover:pl-3 p-1.5 rounded-xl -ml-1.5">
            <span className="text-sm text-slate-600 font-semibold">{item.title}</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Rs. {item.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleView;
