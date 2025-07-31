        {/* Paso 3: Información del Negocio */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información del Negocio</h2>
            
            {/* Descripción del negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Negocio *</label>
              <textarea
                name="descripcion_negocio"
                value={formData.descripcion_negocio}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.descripcion_negocio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe qué servicios ofreces, tu especialidad y qué te hace único en el mercado..."
              />
              {errors.descripcion_negocio && <p className="text-red-500 text-sm mt-1">{errors.descripcion_negocio}</p>}
            </div>

            {/* Años de funcionamiento y logo */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Años de Funcionamiento *</label>
                <select
                  name="anos_funcionamiento"
                  value={formData.anos_funcionamiento}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.anos_funcionamiento ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona...</option>
                  <option value="menos_1">Menos de 1 año</option>
                  <option value="1-3">1 a 3 años</option>
                  <option value="4-7">4 a 7 años</option>
                  <option value="8-15">8 a 15 años</option>
                  <option value="mas_15">Más de 15 años</option>
                </select>
                {errors.anos_funcionamiento && <p className="text-red-500 text-sm mt-1">{errors.anos_funcionamiento}</p>}
              </div>

              {/* Logo de la empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
                <div className="flex items-center space-x-4">
                  {formData.logo_preview && (
                    <img 
                      src={formData.logo_preview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo_upload"
                    />
                    <label
                      htmlFor="logo_upload"
                      className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {formData.logo_preview ? 'Cambiar Logo' : 'Subir Logo'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Máximo 5MB</p>
                  </div>
                </div>
                {errors.logo_file && <p className="text-red-500 text-sm mt-1">{errors.logo_file}</p>}
              </div>
            </div>

            {/* Servicios que ofrece */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Servicios que Ofreces *</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  name="nuevo_servicio"
                  value={formData.nuevo_servicio}
                  onChange={handleInputChange}
                  placeholder="Ej: Cambio de aceite, Alineación y balanceo..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarServicio())}
                />
                <button
                  type="button"
                  onClick={agregarServicio}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
              
              {formData.servicios.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Servicios agregados:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.servicios.map((servicio, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {servicio}
                        <button
                          type="button"
                          onClick={() => eliminarServicio(servicio)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {errors.servicios && <p className="text-red-500 text-sm mt-1">{errors.servicios}</p>}
            </div>

            {/* Horarios de atención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Horarios de Atención *</label>
              <div className="space-y-3">
                {Object.entries(formData.horarios).map(([dia, horario]) => (
                  <div key={dia} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20">
                      <input
                        type="checkbox"
                        checked={horario.activo}
                        onChange={(e) => handleHorarioChange(dia, 'activo', e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium capitalize">{dia}</span>
                    </div>
                    
                    {horario.activo && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={horario.inicio}
                            onChange={(e) => handleHorarioChange(dia, 'inicio', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">a</span>
                          <input
                            type="time"
                            value={horario.fin}
                            onChange={(e) => handleHorarioChange(dia, 'fin', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </>
                    )}
                    
                    {!horario.activo && (
                      <span className="text-gray-500 text-sm">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
              {errors.horarios && <p className="text-red-500 text-sm mt-1">{errors.horarios}</p>}
            </div>

            {/* Galería de imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Galería de Imágenes</label>
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGaleriaChange}
                    className="hidden"
                    id="galeria_upload"
                  />
                  <label
                    htmlFor="galeria_upload"
                    className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors inline-block"
                  >
                    Agregar Imágenes
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Máximo 10 imágenes, 5MB cada una</p>
                </div>
                
                {formData.galeria_previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.galeria_previews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={preview} 
                          alt={`Galería ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarImagenGaleria(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.galeria_files && <p className="text-red-500 text-sm mt-1">{errors.galeria_files}</p>}
            </div>

            {/* Validación por agente */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-4">🔍 Validación Presencial</h3>
              <p className="text-yellow-800 mb-4">
                Para garantizar la autenticidad de los proveedores, ofrecemos un servicio de validación presencial
                donde uno de nuestros agentes puede visitar tu local para verificar la información.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="acepta_visita_agente"
                    checked={formData.acepta_visita_agente}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Acepto que un agente visite mi local para validación (Recomendado)
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="requiere_validacion_presencial"
                    checked={formData.requiere_validacion_presencial}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Solicito validación presencial prioritaria
                  </label>
                </div>
              </div>
              
              {formData.acepta_visita_agente && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios para la visita (opcional)</label>
                  <textarea
                    name="comentarios_visita"
                    value={formData.comentarios_visita}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Ej: Mejor horario para visita, instrucciones especiales, etc."
                  />
                </div>
              )}
            </div>

            {/* Categorías y marcas existentes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorías de Servicio *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {categoriasDisponibles.map((categoria) => (
                    <label key={categoria} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="categorias_servicios"
                        value={categoria}
                        checked={formData.categorias_servicios.includes(categoria)}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{categoria}</span>
                    </label>
                  ))}
                </div>
                {errors.categorias_servicios && <p className="text-red-500 text-sm mt-1">{errors.categorias_servicios}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marcas de Vehículos que Atiendes *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {marcasDisponibles.map((marca) => (
                    <label key={marca} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        name="marcas_vehiculos"
                        value={marca}
                        checked={formData.marcas_vehiculos.includes(marca)}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{marca}</span>
                    </label>
                  ))}
                </div>
                {errors.marcas_vehiculos && <p className="text-red-500 text-sm mt-1">{errors.marcas_vehiculos}</p>}
              </div>
            </div>
          </div>
        )}
