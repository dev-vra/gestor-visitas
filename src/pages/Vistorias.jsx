import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Vistorias.module.css";
import { Search, Plus, Filter, Loader2, MapPin, FileDown, Bot } from "lucide-react";
import VistoriaModal from "../components/VistoriaModal";
import LocationLink from "../components/LocationLink";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export default function Vistorias() {
  const { profile } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Derived options for filters
  const availableCities = [
    ...new Set(visits.map((v) => v.city).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const availableNeighborhoods = [
    ...new Set(
      visits
        .filter((v) => !selectedCity || v.city === selectedCity)
        .map((v) => v.neighborhood)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    let query = supabase
      .from("visits")
      .select(`
        *,
        profiles:agent_id (full_name)
      `)
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) console.error(error);
    else setVisits(data || []);
    setLoading(false);
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      visit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.cpf?.includes(searchTerm);
    const matchesCity = !selectedCity || visit.city === selectedCity;
    const matchesNeighborhood =
      !selectedNeighborhood || visit.neighborhood === selectedNeighborhood;
    const matchesStatus = !selectedStatus || visit.status === selectedStatus;

    return matchesSearch && matchesCity && matchesNeighborhood && matchesStatus;
  });

  const handleEdit = (visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedVisit(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
    fetchVisits();
  };

  const handleExportExcel = () => {
    const dataToExport = filteredVisits.map((v) => ({
      Cidade: v.city,
      Bairro: v.neighborhood,
      Nome: v.name,
      Celular: v.phone1,
      Telefone2: v.phone2,
      Quadra: v.address_block,
      Lote: v.address_lot,
      Rua: v.address_street || "-",
      Número: v.address_number || "-",
      Status: v.status,
      Observação: v.observations || "-",
      "Data Prevista": v.date_predicted
        ? format(new Date(v.date_predicted), "dd/MM/yyyy")
        : "-",
      Realizado: "",
    }));

    const filterText = `Filtros: Cidade: ${selectedCity || "Todas"} | Bairro: ${
      selectedNeighborhood || "Todos"
    } | Status: ${selectedStatus || "Todos"} | Busca: ${searchTerm || "-"}`;
    const printDate = `Gerado em: ${new Date().toLocaleString()}`;

    const headers = [
      "Cidade",
      "Bairro",
      "Nome",
      "Celular",
      "Telefone2",
      "Quadra",
      "Lote",
      "Rua",
      "Número",
      "Status",
      "Observação",
      "Data Prevista",
      "Realizado",
    ];
    const body = dataToExport.map((row) => [
      row.Cidade,
      row.Bairro,
      row.Nome,
      row.Celular,
      row.Telefone2,
      row.Quadra,
      row.Lote,
      row.Rua,
      row.Número,
      row.Status,
      row.Observação,
      row["Data Prevista"],
      row.Realizado,
    ]);

    const finalData = [
      [filterText],
      [printDate],
      [],
      headers,
      ...body,
    ];

    const ws = XLSX.utils.aoa_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vistorias");
    XLSX.writeFile(wb, "vistorias.xlsx");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Vistoria realizada com sucesso":
        return "var(--status-completed)";
      case "Vistoria realizada sem sucesso":
        return "var(--status-missed)";
      case "Vistoria Agendada":
        return "var(--status-scheduled)";
      case "Vistoria realizada (aguardando alterações)":
      case "Agendar Vistoria":
        return "var(--status-pending)";
      default:
        return "var(--status-pending)";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vistorias</h1>
          <p className={styles.subtitle}>Gerencie agendamentos e vistorias</p>
        </div>
        <div className={styles.actions}>
          <button onClick={handleExportExcel} className={styles.btnSecondary}>
            <FileDown size={18} />
            Exportar Excel
          </button>
          {(profile?.role === "gestor" || profile?.role === "consultor") && (
            <button
              onClick={handleNew}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <Plus size={18} />
              Nova Vistoria
            </button>
          )}
        </div>
      </div>

      <div className={`glass-panel ${styles.filters}`}>
        <div className={styles.searchBox}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedNeighborhood("");
          }}
        >
          <option value="">Todas as Cidades</option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
        >
          <option value="">Todos os Bairros</option>
          {availableNeighborhoods.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="Vistoria Agendada">Vistoria Agendada</option>
          <option value="Vistoria realizada com sucesso">
            Vistoria realizada com sucesso
          </option>
          <option value="Vistoria realizada sem sucesso">
            Vistoria realizada sem sucesso
          </option>
          <option value="Vistoria realizada (aguardando alterações)">
            Vistoria realizada (aguardando alterações)
          </option>
        </select>
      </div>

      <div className={`glass-panel ${styles.tableContainer}`}>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Contribuinte</th>
                <th>Endereço</th>
                <th>Mapa</th>
                <th>Cidade/Bairro</th>
                <th>Quadra / Lote</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Agente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{visit.name}</div>
                      {visit.source === "Bot" && (
                        <Bot size={16} className="text-blue-400" title="Registrado por Bot IA" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{visit.cpf}</div>
                  </td>
                  <td>
                    <div className="text-sm">{visit.address_street || "-"}</div>
                    <div className="text-xs text-gray-400">
                      {visit.address_number ? `Nº ${visit.address_number}` : "-"}
                    </div>
                  </td>
                  <td>
                    {visit.location_url && (
                      <LocationLink url={visit.location_url} />
                    )}
                  </td>
                  <td>
                    {visit.city} / {visit.neighborhood}
                  </td>
                  <td>
                    <div className="text-sm">
                      {visit.address_block && `Q: ${visit.address_block}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {visit.address_lot && `L: ${visit.address_lot}`}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{visit.phone1}</div>
                    <div className="text-xs text-gray-400">{visit.phone2}</div>
                  </td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `${getStatusColor(visit.status)}20`,
                        color: getStatusColor(visit.status),
                        border: `1px solid ${getStatusColor(visit.status)}`,
                      }}
                    >
                      {visit.status}
                    </span>
                  </td>
                  <td>{visit.profiles?.full_name || "-"}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(visit)}
                      className={styles.linkBtn}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <VistoriaModal visit={selectedVisit} onClose={handleModalClose} />
      )}
    </div>
  );
}
