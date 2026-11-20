import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, CheckCircle, ShieldCheck, CreditCard, Building2, User, Calendar, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  const [downloading, setDownloading] = useState(false);
  const printableRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const {
    invoiceNumber = 'INV-' + Date.now().toString().slice(-6),
    amount = 0,
    previousPaid = 0,
    balanceAfter = 0,
    paymentDate = new Date(),
    paymentMethod = 'Cash',
    remarks = '',
    month = '',
    year = '',
    totalAmount = 0,
    status = 'Paid',
    description = 'Monthly Tuition Fee',
    student = {},
    institute = {}
  } = invoice;

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;
    setDownloading(true);
    const toastId = toast.loading('Generating PDF Invoice...');

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Center vertically if it fits on one page
      pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, Math.min(pdfHeight, 285));
      pdf.save(`Invoice_${invoiceNumber}.pdf`);
      toast.success('Invoice downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Invoice PDF error:', err);
      toast.error('Failed to generate PDF invoice', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const instituteName = institute?.name || 'Mantech Attendance Pro';
  const instituteLogo = institute?.logo;
  const brandColor = institute?.brandingColor || '#3b82f6';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 my-8"
        >
          {/* Top Actions Bar */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Payment Receipt</h3>
                <p className="text-[11px] text-slate-400 font-medium">#{invoiceNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" /> Print
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-500/25 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container (Strict White Canvas for Clean PDFs & Prints) */}
          <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
            <div
              ref={printableRef}
              id="invoice-printable-area"
              className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {instituteLogo ? (
                    <img src={instituteLogo} alt="Logo" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ backgroundColor: brandColor }}
                    >
                      {instituteName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">{instituteName}</h2>
                    <p className="text-xs text-slate-500 font-medium">Coaching & Institute Management</p>
                    {institute?.email && <p className="text-[11px] text-slate-400">{institute.email}</p>}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black tracking-wider uppercase">
                    Fee Payment Receipt
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-2">Invoice: #{invoiceNumber}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{fmtDate(paymentDate)}</p>
                </div>
              </div>

              {/* Billed To & Session Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Student Details</p>
                  <p className="text-sm font-bold text-slate-900">{student?.name || 'Student'}</p>
                  <p className="text-slate-600 mt-0.5">Roll Number: <span className="font-semibold text-slate-900">#{student?.rollNumber || 'N/A'}</span></p>
                  {student?.contactNumber && <p className="text-slate-500">Contact: {student.contactNumber}</p>}
                </div>

                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Details</p>
                  <p className="text-sm font-bold text-slate-900">{month} {year}</p>
                  <p className="text-slate-600 mt-0.5">Mode: <span className="font-semibold text-slate-900">{paymentMethod}</span></p>
                  <p className="text-slate-500">{description || 'Monthly Tuition Fee'}</p>
                </div>
              </div>

              {/* Table of Breakdown */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Month/Period</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        Total Course / Batch Fee
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{month} {year}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{Number(totalAmount).toLocaleString()}</td>
                    </tr>
                    {previousPaid > 0 && (
                      <tr className="bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-500">Previously Paid Amount</td>
                        <td className="py-2.5 px-4 text-center text-slate-400">—</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-600">₹{Number(previousPaid).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/40">
                      <td className="py-3.5 px-4 font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Amount Received in this Transaction
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-700 font-medium">{paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                        ₹{Number(amount).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-slate-700">Remaining Pending Balance</td>
                      <td className={`py-3 px-4 text-right font-black text-sm ${balanceAfter > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{Number(balanceAfter).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remarks if any */}
              {remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Remarks:</span> {remarks}
                </div>
              )}

              {/* Status and Signature footer */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Verified Payment · Official Institute Record</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">This is an automated system generated receipt.</p>
                </div>

                <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
                  <div className="w-40 border-b border-slate-300 mb-1 mx-auto sm:ml-auto" />
                  <p className="text-[11px] font-bold text-slate-700">Authorized Signature</p>
                  <p className="text-[10px] text-slate-400">{instituteName}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InvoiceModal;
