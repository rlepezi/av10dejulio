import React, { useState, useEffect } from 'react';
import { useClientMembership } from '../hooks/useClientMembership';
import { CLIENT_MEMBERSHIP_PLANS, formatPrice } from '../constants/membershipPlans';

export default function ClientMembershipManager({ clienteId }) {
  const {
    membership,
    loading,
    error,
    puntos,
    beneficios,
    updatePuntos,
    canjearOferta,
    getCurrentPlan,
    getProgressToNextLevel,
    canAccessBenefit,
    getAvailableOffers,
    getActivityHistory,
    getMembershipStats
  } = useClientMembership(clienteId);

  const [showOffersModal, setShowOffersModal] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [redeemingOffer, setRedeemingOffer] = useState(null);

  useEffect(() => {
    if (membership) {
      loadAvailableOffers();
      setActivityHistory(getActivityHistory());
    }
  }, [membership]);

  const loadAvailableOffers = async () => {
    const offers = await getAvailableOffers();
    setAvailableOffers(offers);
  };

  const handleRedeemOffer = async (offer) => {
    try {
      setRedeemingOffer(offer.id);
      const result = await canjearOferta(offer.id, offer.puntosRequeridos);
      
      if (result.success) {
        alert(`✅ ¡Oferta canjeada exitosamente! Puntos restantes: ${result.puntosRestantes}`);
        await loadAvailableOffers();
        setActivityHistory(getActivityHistory());
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Error al canjear oferta: ${error.message}`);
    } finally {
      setRedeemingOffer(null);
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'premium': return 'from-purple-500 to-pink-500';
      case 'intermedio': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'premium': return '👑';
      case 'intermedio': return '⭐';
      default: return '🔰';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <p className="font-medium">Error al cargar la membresía:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const progress = getProgressToNextLevel();
  const stats = getMembershipStats();

  return (
    <div className="space-y-6">
      {/* Tarjeta de Membresía Principal */}
      <div className={`bg-gradient-to-r ${getNivelColor(membership?.nivel)} text-white rounded-lg shadow p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getNivelIcon(membership?.nivel)}</span>
            <div>
              <h2 className="text-xl font-bold capitalize">{membership?.nivel} Member</h2>
              <p className="text-sm opacity-90">Miembro de la Comunidad AV 10 de Julio</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{puntos}</div>
            <div className="text-sm opacity-90">Puntos</div>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso hacia {progress.nextLevel || 'máximo nivel'}</span>
            <span>{progress.current}/{progress.target} puntos</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Beneficios Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {beneficios.slice(0, 4).map((beneficio, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span>✓</span>
              <span>{beneficio}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas de Membresía */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Membresía</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.serviciosRealizados || 0}</div>
            <p className="text-sm text-gray-600">Servicios Realizados</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${(stats?.ahorroTotal || 0).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Ahorro Total</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.ofertasCanjeadas || 0}</div>
            <p className="text-sm text-gray-600">Ofertas Canjeadas</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{puntos}</div>
            <p className="text-sm text-gray-600">Puntos Acumulados</p>
          </div>
        </div>
      </div>

      {/* Beneficios del Plan Actual */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficios del Plan {currentPlan.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPlan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ofertas Exclusivas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ofertas Exclusivas</h3>
          <button
            onClick={() => setShowOffersModal(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todas las ofertas
          </button>
        </div>
        
        {availableOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableOffers.slice(0, 4).map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">{offer.titulo}</h4>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    {offer.puntosRequeridos} pts
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{offer.descripcion}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Válido hasta: {offer.fechaVencimiento}</span>
                  <button
                    onClick={() => handleRedeemOffer(offer)}
                    disabled={redeemingOffer === offer.id}
                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {redeemingOffer === offer.id ? 'Canjeando...' : 'Canjear'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">🎁</div>
            <p className="text-gray-600">No hay ofertas disponibles en este momento</p>
            <p className="text-sm text-gray-500">Sigue acumulando puntos para acceder a más ofertas</p>
          </div>
        )}
      </div>

      {/* Historial de Actividad */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Actividad</h3>
        {activityHistory.length > 0 ? (
          <div className="space-y-3">
            {activityHistory.slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{activity.accion}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.fecha).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-semibold">+{activity.puntosGanados} pts</p>
                  <p className="text-sm text-gray-500">Total: {activity.puntosTotales}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">Aún no tienes actividad registrada</p>
            <p className="text-sm text-gray-500">Realiza servicios para comenzar a acumular puntos</p>
          </div>
        )}
      </div>

      {/* Modal de Ofertas */}
      {showOffersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Ofertas Exclusivas</h3>
              <button
                onClick={() => setShowOffersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableOffers.map((offer) => (
                <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{offer.titulo}</h4>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      {offer.puntosRequeridos} pts
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{offer.descripcion}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Válido hasta:</span>
                      <span>{offer.fechaVencimiento}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Empresa:</span>
                      <span>{offer.empresa}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeemOffer(offer)}
                    disabled={redeemingOffer === offer.id}
                    className="w-full mt-3 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {redeemingOffer === offer.id ? 'Canjeando...' : 'Canjear Oferta'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
