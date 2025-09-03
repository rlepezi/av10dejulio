import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/PaymentService';
import { formatPrice } from '../constants/membershipPlans';

export default function InvoiceManager({ empresaId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30days'
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (empresaId) {
      loadInvoices();
    }
  }, [empresaId, filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await PaymentService.getInvoices(empresaId, filters);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Pagada';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getInvoiceIcon = (type) => {
    switch (type) {
      case 'subscription':
        return '⭐';
      case 'service':
        return '🛠️';
      case 'upgrade':
        return '📈';
      case 'penalty':
        return '⚠️';
      default:
        return '📄';
    }
  };

  const getInvoiceTypeText = (type) => {
    switch (type) {
      case 'subscription':
        return 'Suscripción';
      case 'service':
        return 'Servicio';
      case 'upgrade':
        return 'Actualización';
      case 'penalty':
        return 'Penalización';
      default:
        return type;
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const result = await PaymentService.downloadInvoice(invoiceId);
      if (result.success) {
        alert('✅ Factura descargada exitosamente');
      } else {
        alert('❌ Error al descargar la factura');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('❌ Error al descargar la factura');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      const result = await PaymentService.sendInvoice(invoiceId);
      if (result.success) {
        alert('✅ Factura enviada por email exitosamente');
      } else {
        alert('❌ Error al enviar la factura');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('❌ Error al enviar la factura');
    }
  };

  const getTotalAmount = () => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getPendingAmount = () => {
    return invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getOverdueAmount = () => {
    return invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando facturas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Facturación */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pagado</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(getTotalAmount(), 'CLP')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(getPendingAmount(), 'CLP')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencido</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(getOverdueAmount(), 'CLP')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h3 className="text-lg font-medium text-gray-900">Facturas y Facturación</h3>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Filtro de Estado */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="paid">Pagada</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>

            {/* Filtro de Fecha */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="1year">Último año</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-lg">{getInvoiceIcon(invoice.type)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.number || `FAC-${invoice.id.slice(-6)}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getInvoiceTypeText(invoice.type)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(invoice.amount, invoice.currency)}
                      </div>
                      {invoice.tax && (
                        <div className="text-xs text-gray-500">
                          IVA: {formatPrice(invoice.tax, invoice.currency)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString()}
                      {invoice.dueDate && (
                        <div className="text-xs text-gray-500">
                          Vence: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Ver
                        </button>
                        {invoice.status === 'paid' && (
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Descargar
                          </button>
                        )}
                        <button
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="text-purple-600 hover:text-purple-900 text-xs"
                        >
                          Enviar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-500">No hay facturas disponibles</p>
            <p className="text-sm text-gray-400">Las facturas aparecerán aquí cuando se generen</p>
          </div>
        )}
      </div>

      {/* Modal de Vista de Factura */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detalle de Factura</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Header de la Factura */}
              <div className="border-b border-gray-200 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Número de Factura</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedInvoice.number || `FAC-${selectedInvoice.id.slice(-6)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusText(selectedInvoice.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de la Empresa */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-900 mb-2">Información de Facturación</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Empresa</p>
                    <p className="text-gray-900">AV 10 de Julio</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">RUT</p>
                    <p className="text-gray-900">76.123.456-7</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Dirección</p>
                    <p className="text-gray-900">Av. 10 de Julio 1234, Santiago</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">facturacion@av10dejulio.cl</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la Factura */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-900 mb-2">Detalles del Servicio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{selectedInvoice.description}</span>
                    <span className="font-medium">{formatPrice(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  {selectedInvoice.tax && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>IVA (19%)</span>
                      <span>{formatPrice(selectedInvoice.tax, selectedInvoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(selectedInvoice.amount + (selectedInvoice.tax || 0), selectedInvoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="border-b border-gray-200 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Emisión</p>
                    <p className="text-gray-900">
                      {new Date(selectedInvoice.date).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedInvoice.dueDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fecha de Vencimiento</p>
                      <p className="text-gray-900">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Método de Pago */}
              {selectedInvoice.paymentMethod && (
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Método de Pago</h4>
                  <p className="text-gray-600">
                    {selectedInvoice.paymentMethod.type === 'credit_card' ? 'Tarjeta de Crédito' : 
                     selectedInvoice.paymentMethod.type === 'debit_card' ? 'Tarjeta de Débito' :
                     selectedInvoice.paymentMethod.type === 'transfer' ? 'Transferencia Bancaria' :
                     selectedInvoice.paymentMethod.type}
                  </p>
                  {selectedInvoice.paymentMethod.last4 && (
                    <p className="text-sm text-gray-500">
                      •••• •••• •••• {selectedInvoice.paymentMethod.last4}
                    </p>
                  )}
                </div>
              )}

              {/* Notas */}
              {selectedInvoice.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                  <p className="text-gray-600 text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              {selectedInvoice.status === 'paid' && (
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Descargar PDF
                </button>
              )}
              <button
                onClick={() => handleSendInvoice(selectedInvoice.id)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Enviar por Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



