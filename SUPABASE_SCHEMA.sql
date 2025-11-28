-- ============================================================
-- SUPABASE DATABASE SCHEMA - HACKQUALI APP
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('resident', 'contractor', 'technician')),
  company_id UUID,
  phone_number VARCHAR(20),
  cpf VARCHAR(11),
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 2. BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(20),
  total_units INT,
  description TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 3. UNITS TABLE
CREATE TABLE IF NOT EXISTS public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  floor INT,
  resident_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  block VARCHAR(50),
  type VARCHAR(50),
  area_sqm DECIMAL(10,2),
  unit_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (building_id, unit_number)
);

-- 4. SERVICE_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  evaluation_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 5. MAINTENANCE_HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status_change_from VARCHAR(50),
  status_change_to VARCHAR(50),
  hours_worked DECIMAL(5,2),
  materials_used TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 5B. SCHEDULING TABLE (Agendamento de visitas)
CREATE TABLE IF NOT EXISTS public.scheduling (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 6. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  speed_rating INT CHECK (speed_rating BETWEEN 1 AND 5),
  professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
  nps_score INT CHECK (nps_score BETWEEN 0 AND 10),
  comments TEXT,
  suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE (service_request_id)
);

-- 7. COSTS TABLE
CREATE TABLE IF NOT EXISTS public.costs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('labor', 'material', 'equipment')),
  description VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_buildings_contractor_id ON public.buildings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_units_building_id ON public.units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_resident_id ON public.units(resident_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_code ON public.units(unit_code);
CREATE INDEX IF NOT EXISTS idx_service_requests_building_id ON public.service_requests(building_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_unit_id ON public.service_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_requester_id ON public.service_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to ON public.service_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_service_request_id ON public.maintenance_history(service_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_technician_id ON public.maintenance_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_feedback_service_request_id ON public.feedback(service_request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_resident_id ON public.feedback(resident_id);
CREATE INDEX IF NOT EXISTS idx_feedback_technician_id ON public.feedback(technician_id);
CREATE INDEX IF NOT EXISTS idx_costs_service_request_id ON public.costs(service_request_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_service_request_id ON public.scheduling(service_request_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_technician_id ON public.scheduling(technician_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_scheduled_start ON public.scheduling(scheduled_start);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Buildings policies
CREATE POLICY "Contractors can view their own buildings" ON public.buildings
  FOR SELECT USING (auth.uid() = contractor_id);

CREATE POLICY "Contractors can insert buildings" ON public.buildings
  FOR INSERT WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update their own buildings" ON public.buildings
  FOR UPDATE USING (auth.uid() = contractor_id)
  WITH CHECK (auth.uid() = contractor_id);

-- Units policies
CREATE POLICY "Users can view units in their buildings" ON public.units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = units.building_id 
      AND buildings.contractor_id = auth.uid()
    )
    OR units.resident_id = auth.uid()
  );

CREATE POLICY "Contractors can insert units" ON public.units
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = units.building_id 
      AND buildings.contractor_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can update units" ON public.units
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = units.building_id 
      AND buildings.contractor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = units.building_id 
      AND buildings.contractor_id = auth.uid()
    )
  );

-- Service requests policies
CREATE POLICY "Users can view service requests in their scope" ON public.service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = service_requests.building_id 
      AND buildings.contractor_id = auth.uid()
    )
    OR service_requests.requester_id = auth.uid()
    OR service_requests.assigned_to = auth.uid()
  );

CREATE POLICY "Residents can create service requests" ON public.service_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = service_requests.unit_id 
      AND units.resident_id = auth.uid()
    )
  );

CREATE POLICY "Contractors and technicians can update service requests" ON public.service_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = service_requests.building_id 
      AND buildings.contractor_id = auth.uid()
    )
    OR service_requests.assigned_to = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buildings 
      WHERE buildings.id = service_requests.building_id 
      AND buildings.contractor_id = auth.uid()
    )
    OR service_requests.assigned_to = auth.uid()
  );

-- Maintenance history policies
CREATE POLICY "Users can view maintenance history" ON public.maintenance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests 
      WHERE service_requests.id = maintenance_history.service_request_id
      AND (
        EXISTS (
          SELECT 1 FROM public.buildings 
          WHERE buildings.id = service_requests.building_id 
          AND buildings.contractor_id = auth.uid()
        )
        OR service_requests.requester_id = auth.uid()
        OR service_requests.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Technicians can insert maintenance history" ON public.maintenance_history
  FOR INSERT WITH CHECK (technician_id = auth.uid());

-- Feedback policies
CREATE POLICY "Users can view feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests 
      WHERE service_requests.id = feedback.service_request_id
      AND (
        EXISTS (
          SELECT 1 FROM public.buildings 
          WHERE buildings.id = service_requests.building_id 
          AND buildings.contractor_id = auth.uid()
        )
        OR feedback.resident_id = auth.uid()
        OR feedback.technician_id = auth.uid()
      )
    )
  );

CREATE POLICY "Residents can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (resident_id = auth.uid());

CREATE POLICY "Residents can update their feedback" ON public.feedback
  FOR UPDATE USING (resident_id = auth.uid())
  WITH CHECK (resident_id = auth.uid());

-- Costs policies
CREATE POLICY "Users can view costs" ON public.costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests 
      WHERE service_requests.id = costs.service_request_id
      AND (
        EXISTS (
          SELECT 1 FROM public.buildings 
          WHERE buildings.id = service_requests.building_id 
          AND buildings.contractor_id = auth.uid()
        )
        OR service_requests.requester_id = auth.uid()
      )
    )
  );

CREATE POLICY "Contractors can insert costs" ON public.costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      JOIN public.buildings b ON b.id = sr.building_id
      WHERE sr.id = costs.service_request_id 
      AND b.contractor_id = auth.uid()
    )
  );

-- Scheduling policies
CREATE POLICY "Users can view scheduling for their requests" ON public.scheduling
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      JOIN public.buildings b ON b.id = sr.building_id
      WHERE sr.id = scheduling.service_request_id
      AND (
        b.contractor_id = auth.uid()
        OR sr.requester_id = auth.uid()
        OR sr.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Technicians can create and update scheduling" ON public.scheduling
  FOR INSERT WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Technicians can update their own scheduling" ON public.scheduling
  FOR UPDATE USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());
