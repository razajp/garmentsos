import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Trash2, Printer, Calendar, Tag, Box, Wallet, Layers, X } from 'lucide-react';
import { articlesAPI, productionAPI } from '../../services/api';
import { MetricTile, InfoRow } from '../../components/ui/Card'; 
import { Button, ConfirmationModal, Loader, PageHeader } from '../../components/ui';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../../context/ConfigContext';

const ArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [receivings, setReceivings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const { config } = useConfig();
  const imageSrc = article?.image?.startsWith('data:') ? article.image : `http://localhost:5000/${article?.image}`;
  const setIsMaximized = () => {};

  useEffect(() => {
    Promise.all([
      articlesAPI.getOne(id),
      productionAPI.getAll({ type: 'receive', limit: 1000, sortBy: 'production_date', order: 'desc' }),
    ])
      .then(([articleRes, productionRes]) => {
        setArticle(articleRes.data.data);
        setReceivings(
          productionRes.data.data
            .filter((ticket) => Number(ticket.article_id) === Number(id))
            .sort((a, b) => new Date(b.production_date) - new Date(a.production_date))
        );
      })
      .catch(() => navigate('/articles'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await articlesAPI.delete(id);
      toast.success('Article deleted successfully');
      navigate('/articles');
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  const stockPkt = receivings.reduce((sum, ticket) => sum + (Number(ticket.article_quantity) || 0), 0);
  const stockPcs = stockPkt * (Number(article?.unit) || 0);

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
            <MetricTile label="Net Rate" value={`Rs. ${(article.net_rate || 0).toLocaleString()}`} icon={Tag} variant="info" />
            <MetricTile label="Sale Rate" value={`Rs. ${(article.sales_rate || 0).toLocaleString()}`} icon={Tag} variant="success" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Receivings */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white rounded-3xl border border-slate-200 p-1.5 shadow-sm relative overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Production Receivings</h3>
                    <p className="text-sm text-slate-500 mt-1">Stock is calculated from these receive tickets.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Current Stock</p>
                    <p className="text-lg font-black text-slate-900">{stockPkt.toLocaleString()} pkt / {stockPcs.toLocaleString()} pcs</p>
                  </div>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left rounded-l-2xl">Date</th>
                        <th className="px-4 py-3 text-left">Ticket</th>
                        <th className="px-4 py-3 text-left">Contractor</th>
                        <th className="px-4 py-3 text-right">Pkt</th>
                        <th className="px-4 py-3 text-right">Pcs</th>
                        <th className="px-4 py-3 text-right">Production Cost</th>
                        <th className="px-4 py-3 text-right">Tag Cost</th>
                        <th className="px-4 py-3 text-right rounded-r-2xl">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!receivings.length && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No production received for this article yet.</td>
                        </tr>
                      )}
                      {receivings.map((ticket) => {
                        const pkt = Number(ticket.article_quantity) || 0;
                        const pcs = pkt * (Number(article.unit) || 0);
                        return (
                          <tr key={ticket.id} onClick={() => navigate(`/production/view/${ticket.id}`)} className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-300">
                            <td className="px-4 py-3 text-slate-700">{new Date(ticket.production_date).toLocaleDateString('en-PK')}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{ticket.ticket_no}</td>
                            <td className="px-4 py-3 text-slate-600">{ticket.contractor_name || 'Unknown Contractor'}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{pkt.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{pcs.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">Rs. {(Number(ticket.cost_per_piece) || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">Rs. {(Number(ticket.tag_cost_per_piece) || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">Rs. {(Number(ticket.total_cost_per_piece) || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar Specs */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* Spec Sheet Card */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <h4 className="text-[11px] font-medium uppercase tracking-widest text-slate-400 mb-6">Specification Sheet</h4>
                
                <div className="space-y-5">
                  <SidebarItem icon={Layers} label="Season" value={article.season} />
                  <SidebarItem icon={Box} label="Category" value={article.category} />
                  <SidebarItem icon={Box} label="Size" value={article.size} />
                  <SidebarItem icon={Calendar} label="Unit" value={`${article.unit || 0} pcs / pkt`} />
                  <SidebarItem icon={Calendar} label="Stock" value={`${stockPkt.toLocaleString()} pkt / ${stockPcs.toLocaleString()} pcs`} />
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

      {false && (
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
