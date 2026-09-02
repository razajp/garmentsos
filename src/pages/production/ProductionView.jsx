import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageCheck } from 'lucide-react';
import { productionAPI } from '../../services/api';
import { Badge, Loader, PageHeader } from '../../components/ui';

const ProductionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productionAPI.getOne(id).then((res) => setTicket(res.data.data)).catch(() => navigate('/production')).finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loader size="lg" className="h-full" />;

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={ticket.ticket_no} subtitle={`${ticket.contractor?.contractor_name || 'Contractor'} - ${new Date(ticket.production_date).toLocaleDateString('en-PK')}`} badge={ticket.type === 'issue' ? 'Issue' : 'Receive'} showBack backPath="/production" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-scroll">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-300 p-1.5">
          <div className="p-6">
            <table className="w-full">
              <thead className="bg-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-left">Unit</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Quantity</th></tr>
              </thead>
              <tbody>
                {ticket.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="px-4 py-3"><Badge variant="info">{item.item_type}</Badge><p className="text-sm text-slate-600 mt-1">{item.description}</p></td>
                    <td className="px-4 py-3 text-slate-600">{item.unit || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(item.rate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold">{item.quantity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="lg:col-span-4">
          <div className="bg-slate-900 rounded-3xl p-7 text-white">
            <PackageCheck className="text-emerald-400 mb-5" size={28} />
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Ticket Summary</p>
            <p className="text-2xl font-black mt-2">{ticket.type === 'issue' ? 'Issued' : 'Received'}</p>
            {ticket.article ? <p className="text-sm text-slate-300 mt-4">{ticket.article.article_no}: {ticket.article_quantity} pkt</p> : null}
            {ticket.type === 'receive' ? (
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>Cost: Rs. {(ticket.cost_per_piece || 0).toLocaleString()} / pc</p>
                <p>Tag Cost: Rs. {(ticket.tag_cost_per_piece || 0).toLocaleString()} / pc</p>
                <p>Total Cost: Rs. {(ticket.total_cost_per_piece || 0).toLocaleString()} / pc</p>
                <p>Net: Rs. {(ticket.net_rate || 0).toLocaleString()} / pc</p>
                <p>Sale: Rs. {(ticket.sale_rate_per_piece || 0).toLocaleString()} / pc</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductionView;
