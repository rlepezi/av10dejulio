import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/PaymentService';

export default function PaymentMethodManager({ empresaId, onPaymentMethodChange }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    isDefault: false
  });

  useEffect(() => {
    if (empresaId) {
      loadPaymentMethods();
    }
  }, [empresaId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await PaymentService.getPaymentMethods(empresaId);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvv || !newPaymentMethod.cardholderName) {
      alert('Por favor, completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      
      const methodData = {
        ...newPaymentMethod,
        empresaId,
        last4: newPaymentMethod.cardNumber.slice(-4),
        brand: detectCardBrand(newPaymentMethod.cardNumber)
      };

      const result = await PaymentService.addPaymentMethod(methodData);
      
      if (result.success) {
        await loadPaymentMethods();
        setShowAddModal(false);
        setNewPaymentMethod({
          type: 'credit_card',
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          isDefault: false
        });
        
        if (onPaymentMethodChange) {
          onPaymentMethodChange(result.paymentMethod);
        }
        
        alert('✅ Método de pago agregado exitosamente');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('❌ Error al agregar el método de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      try {
        setLoading(true);
        await PaymentService.removePaymentMethod(methodId);
        await loadPaymentMethods();
        alert('✅ Método de pago eliminado');
      } catch (error) {
        console.error('Error removing payment method:', error);
        alert('❌ Error al eliminar el método de pago');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      setLoading(true);
      await PaymentService.setDefaultPaymentMethod(empresaId, methodId);
      await loadPaymentMethods();
      alert('✅ Método de pago predeterminado actualizado');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      alert('❌ Error al actualizar el método predeterminado');
    } finally {
      setLoading(false);
    }
  };

  const detectCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6/.test(number)) return 'discover';
    
    return 'unknown';
  };

  const getCardIcon = (brand) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  const formatCardNumber = (number) => {
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métodos de Pago Existentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Métodos de Pago</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Agregar Método
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCardIcon(method.brand)}</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.brand === 'amex' ? 'American Express' : 
                       method.brand === 'visa' ? 'Visa' :
                       method.brand === 'mastercard' ? 'Mastercard' :
                       method.brand === 'discover' ? 'Discover' : 'Tarjeta de Crédito'}
                    </p>
                    <p className="text-sm text-gray-600">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                      {method.cardholderName} - Expira {method.expiryDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Predeterminado
                    </span>
                  )}
                  
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      Hacer Predeterminado
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💳</div>
            <p className="text-gray-500">No tienes métodos de pago configurados</p>
            <p className="text-sm text-gray-400">Agrega uno para poder suscribirte a planes premium</p>
          </div>
        )}
      </div>

      {/* Modal para Agregar Método de Pago */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Método de Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPaymentMethod.cardNumber}
                  onChange={(e) => setNewPaymentMethod({
                    ...newPaymentMethod,
                    cardNumber: e.target.value.replace(/\s/g, '').slice(0, 16)
                  })}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Expiración
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPaymentMethod.expiryDate}
                    onChange={(e) => setNewPaymentMethod({
                      ...newPaymentMethod,
                      expiryDate: e.target.value
                    })}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPaymentMethod.cvv}
                    onChange={(e) => setNewPaymentMethod({
                      ...newPaymentMethod,
                      cvv: e.target.value.slice(0, 4)
                    })}
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPaymentMethod.cardholderName}
                  onChange={(e) => setNewPaymentMethod({
                    ...newPaymentMethod,
                    cardholderName: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newPaymentMethod.isDefault}
                  onChange={(e) => setNewPaymentMethod({
                    ...newPaymentMethod,
                    isDefault: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Hacer método de pago predeterminado
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Agregando...' : 'Agregar Método'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



