import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#6366f1", "#22d3ee", "#facc15", "#f43f5e", "#10b981", "#eab308"];

export default function AdminStats() {
  const [campanasPorMes, setCampanasPorMes] = useState([]);
  const [productosPorCategoria, setProductosPorCategoria] = useState([]);
  const [empresasStats, setEmpresasStats] = useState({
    total: 0,
    porEstado: [],
    porRegion: [],
    porCategoria: [],
  });

  useEffect(() => {
    async function fetchCampanasPorMes() {
      const snap = await getDocs(collection(db, "campanas"));
      const months = {};
      snap.forEach(doc => {
        const fecha = doc.data().fechaCreacion?.toDate?.() || new Date(doc.data().fechaCreacion);
        const key = fecha.getFullYear() + "-" + (fecha.getMonth() + 1).toString().padStart(2, "0");
        months[key] = (months[key] || 0) + 1;
      });
      setCampanasPorMes(
        Object.entries(months)
          .sort()
          .map(([month, count]) => ({ month, count }))
      );
    }
    async function fetchProductosPorCategoria() {
      const snap = await getDocs(collection(db, "productos"));
      const cats = {};
      snap.forEach(doc => {
        (doc.data().categorias || []).forEach(cat =>
          cats[cat] = (cats[cat] || 0) + 1
        );
      });
      setProductosPorCategoria(
        Object.entries(cats)
          .map(([name, value], idx) => ({
            name,
            value,
            fill: COLORS[idx % COLORS.length]
          }))
      );
    }
    async function fetchEmpresasStats() {
      const snap = await getDocs(collection(db, "empresas"));
      const empresas = snap.docs.map(doc => doc.data());
      // Total
      const total = empresas.length;
      // Por estado
      const estadoCount = {};
      empresas.forEach(emp => {
        const est = (emp.estado || "Sin estado").toLowerCase();
        estadoCount[est] = (estadoCount[est] || 0) + 1;
      });
      const porEstado = Object.entries(estadoCount).map(([name, value], idx) => ({
        name,
        value,
        fill: COLORS[idx % COLORS.length]
      }));
      // Por región
      const regionCount = {};
      empresas.forEach(emp => {
        const region = emp.region || "Sin región";
        regionCount[region] = (regionCount[region] || 0) + 1;
      });
      const porRegion = Object.entries(regionCount).map(([name, value], idx) => ({
        name,
        value,
        fill: COLORS[idx % COLORS.length]
      }));
      // Por categoría (acumulando de arrays)
      const catCount = {};
      empresas.forEach(emp => {
        (emp.categorias || []).forEach(cat => {
          catCount[cat] = (catCount[cat] || 0) + 1;
        });
      });
      const porCategoria = Object.entries(catCount).map(([name, value], idx) => ({
        name,
        value,
        fill: COLORS[idx % COLORS.length]
      }));

      setEmpresasStats({
        total,
        porEstado,
        porRegion,
        porCategoria
      });
    }
    fetchEmpresasStats();
    fetchCampanasPorMes();
    fetchProductosPorCategoria();
  }, []);

  return (
    <div className="flex flex-col gap-8 my-8">
      {/* Empresas arriba */}
      <div className="bg-white rounded shadow p-6">
        <h3 className="text-lg font-bold mb-3">Empresas registradas</h3>
        <div className="mb-4">
          <span className="font-bold text-2xl text-blue-800">{empresasStats.total}</span> <span className="text-gray-800">empresas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-600">Por estado</h4>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={empresasStats.porEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                  {empresasStats.porEstado.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-600">Por región</h4>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={empresasStats.porRegion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                  {empresasStats.porRegion.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-600">Por categoría</h4>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={empresasStats.porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                  {empresasStats.porCategoria.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Campañas y productos abajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-bold mb-3">Campañas creadas por mes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={campanasPorMes}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-bold mb-3">Productos por categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={productosPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {productosPorCategoria.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}