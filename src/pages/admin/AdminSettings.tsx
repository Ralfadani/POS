import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { TaxServiceConfig, CafeProfile } from '../../types/index.js';
import { printThermalReceipt } from '../../utils/thermalPrinter.js';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Wifi,
  Clock,
  ReceiptText,
  Percent,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Printer,
  RotateCcw,
  Sliders,
  Coffee,
  Info,
  Lock,
  FileText
} from 'lucide-react';

const DEFAULT_PROFILE: CafeProfile = {
  cafe_name: 'KAFE & RESTO KITA',
  tagline: 'Sistem POS & Layanan Pemesanan Meja',
  address: 'Jl. Utama No. 12, Pusat Kota',
  phone: '0812-3456-7890',
  email: 'kontak@kaferesto.id',
  instagram: '@kaferestokita',
  wifi_ssid: 'KafeResto_Guest_5G',
  wifi_password: 'selamatmenikmati',
  receipt_footer: 'Terima kasih atas kunjungan Anda! Selamat menikmati hidangan.',
  logo_icon: 'Coffee',
  operating_hours: 'Setiap Hari (08:00 - 23:00 WIB)'
};

const DEFAULT_CONFIG: TaxServiceConfig = {
  config_id: 1,
  tax_percentage: 10,
  is_tax_active: true,
  service_charge_percentage: 5,
  is_service_active: true,
  effective_date: new Date().toISOString()
};

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'identity' | 'tax' | 'preview'>('identity');
  const [profile, setProfile] = useState<CafeProfile>(DEFAULT_PROFILE);
  const [config, setConfig] = useState<TaxServiceConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        if (data.config) setConfig(data.config);
        if (data.profile) setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Tax Config
          tax_percentage: Number(config.tax_percentage) || 0,
          is_tax_active: Boolean(config.is_tax_active),
          service_charge_percentage: Number(config.service_charge_percentage) || 0,
          is_service_active: Boolean(config.is_service_active),
          // Cafe Profile
          cafe_name: profile.cafe_name.trim() || 'BREW & BYTE CAFE',
          tagline: profile.tagline.trim(),
          address: profile.address.trim(),
          phone: profile.phone.trim(),
          email: profile.email.trim(),
          instagram: profile.instagram.trim(),
          wifi_ssid: profile.wifi_ssid.trim(),
          wifi_password: profile.wifi_password.trim(),
          receipt_footer: profile.receipt_footer.trim(),
          logo_icon: profile.logo_icon || 'Coffee',
          operating_hours: profile.operating_hours.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) setConfig(data.config);
        if (data.profile) setProfile(data.profile);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4500);
      } else {
        setError(data.error || 'Gagal menyimpan identitas cafe');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan identitas cafe');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan identitas cafe dan pengaturan pajak ke nilai standar default?')) {
      setProfile(DEFAULT_PROFILE);
      setConfig(DEFAULT_CONFIG);
    }
  };

  const handleTestPrintReceipt = () => {
    const subtotal = 78000;
    const serviceCharge = config.is_service_active ? Math.round((subtotal * config.service_charge_percentage) / 100) : 0;
    const tax = config.is_tax_active ? Math.round(((subtotal + serviceCharge) * config.tax_percentage) / 100) : 0;
    const total = subtotal + serviceCharge + tax;

    printThermalReceipt({
      type: 'customer_invoice',
      cafeName: profile.cafe_name,
      cafeAddress: profile.address,
      cafePhone: profile.phone,
      tagline: profile.tagline,
      wifiSsid: profile.wifi_ssid,
      wifiPassword: profile.wifi_password,
      receiptFooter: profile.receipt_footer,
      instagram: profile.instagram,
      tableNumber: 'Meja 05 (Uji Coba)',
      orderId: 1088,
      channel: 'pos_manual',
      cashierName: 'Admin POS (Test Print)',
      items: [
        { name: 'Caramel Macchiato (Hot)', quantity: 1, price: 32000, subtotal: 32000, notes: 'Less sweet' },
        { name: 'Spaghetti Creamy Carbonara', quantity: 1, price: 35000, subtotal: 35000, notes: 'Extra cheese' },
        { name: 'Mineral Water 600ml', quantity: 1, price: 11000, subtotal: 11000 }
      ],
      calculation: {
        subtotal,
        service_charge_rate: config.service_charge_percentage,
        is_service_active: config.is_service_active,
        service_charge: serviceCharge,
        tax_rate: config.tax_percentage,
        is_tax_active: config.is_tax_active,
        tax,
        total
      },
      payment: {
        payment_id: 9999,
        session_id: 'test-session',
        payment_method: 'QRIS',
        nominal: total,
        payment_time: new Date().toISOString(),
        kasir_id: 1,
        subtotal,
        service_charge: serviceCharge,
        tax,
        total,
        cashier_name: 'Admin Kasir'
      }
    });
  };

  // Live simulation calculation
  const sampleSubtotal = 100000;
  const sampleService = config.is_service_active
    ? Math.round((sampleSubtotal * config.service_charge_percentage) / 100)
    : 0;
  const sampleTax = config.is_tax_active
    ? Math.round(((sampleSubtotal + sampleService) * config.tax_percentage) / 100)
    : 0;
  const sampleTotal = sampleSubtotal + sampleService + sampleTax;

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-[#1A3A5C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Memuat konfigurasi identitas cafe...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-4 sm:space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A3A5C] to-[#2a5584] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Pengaturan & Identitas Cafe
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur nama brand, alamat, kontak, WiFi tamu, serta persentase Pajak (PB1) & Service Charge
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTestPrintReceipt}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
            title="Coba cetak format struk thermal 58mm dengan data cafe ini"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Test Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-xs font-bold bg-[#1A3A5C] hover:bg-[#132c47] text-white flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Identitas cafe dan konfigurasi biaya berhasil disimpan! Perubahan langsung diterapkan ke cetak struk, halaman POS kasir, dan menu pelanggan.
          </span>
        </div>
      )}

      {/* Error Notification Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'identity'
              ? 'bg-[#1A3A5C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>1. Profil & Identitas Cafe</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tax'
              ? 'bg-[#1A3A5C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>2. Pajak PB1 & Service Charge</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'preview'
              ? 'bg-[#1A3A5C] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Live Preview Struk & Brand</span>
        </button>
      </div>

      {/* Main Grid View */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left / Middle Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* TAB 1: IDENTITAS CAFE */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* Card 1: Nama, Slogan, dan Logo */}
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A3A5C] flex items-center justify-center font-bold">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Nama Brand & Slogan Cafe</h3>
                    <p className="text-[11px] text-slate-500">Nama resmi yang muncul pada header struk kasir dan judul aplikasi</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <Input
                    label="Nama Cafe / Restoran *"
                    placeholder="Contoh: BREW & BYTE CAFE"
                    value={profile.cafe_name}
                    onChange={e => setProfile(prev => ({ ...prev, cafe_name: e.target.value }))}
                    helperText="Dicetak tebal di baris paling atas struk kasir thermal."
                    required
                  />

                  <Input
                    label="Tagline / Slogan Cafe"
                    placeholder="Contoh: Specialty Coffee, Eatery & Creative Space"
                    value={profile.tagline}
                    onChange={e => setProfile(prev => ({ ...prev, tagline: e.target.value }))}
                    />
                </div>
              </Card>

              {/* Card 2: Lokasi & Kontak Operasional */}
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alamat & Informasi Kontak</h3>
                    <p className="text-[11px] text-slate-500">Alamat lengkap, nomor WhatsApp kasir/pemesanan, dan email</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <Input
                    label="Alamat Lengkap Cafe *"
                    placeholder="Contoh: Jl. Melati No. 45, Kota Baru, Jakarta Selatan"
                    value={profile.address}
                    onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    helperText="Dicetak di bawah nama cafe pada struk pembayaran pelanggan."
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="No. Telepon / WhatsApp"
                      placeholder="Contoh: 0812-3456-7890"
                      value={profile.phone}
                      onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      helperText="Kontak pemesanan atau layanan pelanggan."
                    />

                    <Input
                      label="Email Resmi Cafe"
                      type="email"
                      placeholder="Contoh: hello@brewbyte.cafe"
                      value={profile.email}
                      onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Akun Instagram / Media Sosial"
                      placeholder="Contoh: @brewbyte.cafe"
                      value={profile.instagram}
                      onChange={e => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                      helperText="Ajak pelanggan tag media sosial di struk."
                    />

                    <Input
                      label="Jam Operasional"
                      placeholder="Contoh: Setiap Hari (08:00 - 23:00 WIB)"
                      value={profile.operating_hours}
                      onChange={e => setProfile(prev => ({ ...prev, operating_hours: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>

              {/* Card 3: WiFi Pengunjung & Footer Struk */}
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">WiFi Pengunjung & Catatan Struk</h3>
                    <p className="text-[11px] text-slate-500">Otomatis dicetak di bagian bawah struk agar pengunjung mudah internetan</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Input
                      label="Nama Jaringan WiFi (SSID)"
                      placeholder="Contoh: BrewByte_Guest_5G"
                      value={profile.wifi_ssid}
                      onChange={e => setProfile(prev => ({ ...prev, wifi_ssid: e.target.value }))}
                      helperText="Otomatis dicetak di kotak WiFi pada struk kasir."
                    />

                    <Input
                      label="Password WiFi Tamu"
                      placeholder="Contoh: kopisusugulajawa"
                      value={profile.wifi_password}
                      onChange={e => setProfile(prev => ({ ...prev, wifi_password: e.target.value }))}
                      helperText="Password WiFi untuk kenyamanan pengunjung cafe."
                    />
                  </div>

                  <Input
                    label="Pesan Footer / Catatan Penutup Struk"
                    placeholder="Contoh: Terima kasih atas kunjungan Anda! Tag kami di IG @brewbyte.cafe"
                    value={profile.receipt_footer}
                    onChange={e => setProfile(prev => ({ ...prev, receipt_footer: e.target.value }))}
                    helperText="Teks penutup yang ramah dan berkesan bagi pelanggan."
                  />
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: PAJAK & SERVICE CHARGE */}
          {activeTab === 'tax' && (
            <div className="space-y-5">
              {/* Service Charge Card */}
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Service Charge (Biaya Layanan)</h4>
                      <p className="text-[11px] text-slate-500">Dikenakan sebagai persentase dari subtotal pesanan makanan/minuman</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.is_service_active}
                      onChange={e => setConfig(prev => ({ ...prev, is_service_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A3A5C]"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Persentase Service Charge (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={config.service_charge_percentage}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        service_charge_percentage: parseFloat(e.target.value) || 0
                      }))
                    }
                    disabled={!config.is_service_active}
                    helperText="Standar biaya layanan cafe & resto di Indonesia berkisar antara 5% hingga 10%."
                  />
                </div>
              </Card>

              {/* Tax / PB1 Card */}
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Pajak Restoran (PB1 / Pajak Daerah)</h4>
                      <p className="text-[11px] text-slate-500">Dihitung dari subtotal ditambah biaya layanan (service charge)</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.is_tax_active}
                      onChange={e => setConfig(prev => ({ ...prev, is_tax_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A3A5C]"></div>
                  </label>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Persentase Pajak PB1 (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={config.tax_percentage}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        tax_percentage: parseFloat(e.target.value) || 0
                      }))
                    }
                    disabled={!config.is_tax_active}
                    helperText="Standar Pajak Barang & Jasa Tertentu (PB1) restoran di Indonesia adalah 10%."
                  />
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-5">
              <Card className="p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Uji Coba Cetak Struk Kasir</h3>
                      <p className="text-[11px] text-slate-500">Format thermal printer standar 58mm/80mm sesuai identitas cafe saat ini</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleTestPrintReceipt}
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    <span>Cetak Test Struk</span>
                  </Button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Format struk kasir otomatis menyesuaikan nama cafe, tagline, alamat, nomor telepon, rincian biaya layanan & PB1, informasi WiFi tamu, dan pesan penutup yang Anda simpan.
                </p>
              </Card>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full sm:w-auto h-10 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Nilai Standar</span>
            </button>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold bg-[#1A3A5C] hover:bg-[#132c47] text-white flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Semua Pengaturan Cafe'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Live Mockup Struk Thermal & Brand Card Preview */}
        <div className="space-y-5">
          {/* Live Brand Card Mockup */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-[#1A3A5C] to-[#0f243a] text-white space-y-4 shadow-md rounded-2xl border-none">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold">
                ☕
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/30">
                Profil Aktif
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold tracking-tight text-white">
                {profile.cafe_name || 'BREW & BYTE CAFE'}
              </h3>
              <p className="text-xs text-blue-200 italic mt-0.5">
                {profile.tagline || 'Specialty Coffee, Eatery & Creative Space'}
              </p>
            </div>

            <div className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{profile.address || 'Jl. Melati No. 45, Kota Baru'}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.instagram && (
                <div className="flex items-center gap-2">
                  <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>{profile.instagram}</span>
                </div>
              )}
              {(profile.wifi_ssid || profile.wifi_password) && (
                <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px]">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    WiFi: <strong>{profile.wifi_ssid}</strong> {profile.wifi_password && `(${profile.wifi_password})`}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Live Thermal Receipt Simulator Card */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 space-y-3 font-mono text-slate-800 text-xs shadow-xs relative overflow-hidden">
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <div className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                {profile.cafe_name || 'BREW & BYTE CAFE'}
              </div>
              {profile.tagline && <div className="text-[10px] text-slate-500 italic">{profile.tagline}</div>}
              <div className="text-[10px] text-slate-600 mt-1">{profile.address}</div>
              {profile.phone && <div className="text-[10px] text-slate-500">Telp: {profile.phone}</div>}
              <div className="font-bold text-xs mt-2 bg-slate-100 py-0.5 rounded">*** STRUK PEMBAYARAN ***</div>
            </div>

            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>MEJA:</span>
                <span className="font-bold">MEJA 03</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Order #1042</span>
                <span>Kasir: Siti</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between">
                <span>1x Caramel Macchiato</span>
                <span>Rp 32.000</span>
              </div>
              <div className="flex justify-between">
                <span>1x Beef Burger & Fries</span>
                <span>Rp 38.000</span>
              </div>
              <div className="flex justify-between">
                <span>1x Iced Lemon Tea</span>
                <span>Rp 18.000</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="text-[11px] space-y-1 py-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp 88.000</span>
              </div>
              {config.is_service_active && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge ({config.service_charge_percentage}%):</span>
                  <span>Rp {Math.round((88000 * config.service_charge_percentage) / 100).toLocaleString('id-ID')}</span>
                </div>
              )}
              {config.is_tax_active && (
                <div className="flex justify-between text-slate-600">
                  <span>PB1 Resto ({config.tax_percentage}%):</span>
                  <span>
                    Rp{' '}
                    {Math.round(
                      ((88000 + (config.is_service_active ? (88000 * config.service_charge_percentage) / 100 : 0)) *
                        config.tax_percentage) /
                        100
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-900 text-slate-900">
                <span>TOTAL:</span>
                <span>
                  Rp{' '}
                  {(
                    88000 +
                    (config.is_service_active ? Math.round((88000 * config.service_charge_percentage) / 100) : 0) +
                    (config.is_tax_active
                      ? Math.round(
                          ((88000 +
                            (config.is_service_active ? (88000 * config.service_charge_percentage) / 100 : 0)) *
                            config.tax_percentage) /
                            100
                        )
                      : 0)
                  ).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* WiFi Box on Receipt */}
            {(profile.wifi_ssid || profile.wifi_password) && (
              <div className="border border-dashed border-slate-400 bg-slate-50 p-2 rounded text-center text-[10px] space-y-0.5">
                <div className="font-bold">📶 FREE GUEST WIFI</div>
                {profile.wifi_ssid && <div>SSID: {profile.wifi_ssid}</div>}
                {profile.wifi_password && <div>Pass: {profile.wifi_password}</div>}
              </div>
            )}

            {/* Receipt Footer Message */}
            <div className="text-center text-[10px] text-slate-600 pt-2 border-t border-dashed border-slate-300">
              <div>{profile.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</div>
              {profile.instagram && <div className="font-bold mt-0.5">IG: {profile.instagram}</div>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
