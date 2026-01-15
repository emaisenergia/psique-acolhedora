-- Create financial_goals table for monthly goals
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL, -- First day of the month
  revenue_goal NUMERIC NOT NULL DEFAULT 0,
  sessions_goal INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month)
);

-- Enable RLS
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Psychologists and admins can view goals" 
ON public.financial_goals FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create goals" 
ON public.financial_goals FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update goals" 
ON public.financial_goals FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete goals" 
ON public.financial_goals FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create recurring_transactions table
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  payment_method TEXT,
  day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_month DATE, -- Track when last transaction was generated
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Psychologists and admins can view recurring transactions" 
ON public.recurring_transactions FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can create recurring transactions" 
ON public.recurring_transactions FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Psychologists and admins can update recurring transactions" 
ON public.recurring_transactions FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'psychologist'::app_role));

CREATE POLICY "Admins can delete recurring transactions" 
ON public.recurring_transactions FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add is_confirmed column to financial_transactions for bank reconciliation
ALTER TABLE public.financial_transactions 
ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Create triggers for updated_at
CREATE TRIGGER update_financial_goals_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
BEFORE UPDATE ON public.recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();