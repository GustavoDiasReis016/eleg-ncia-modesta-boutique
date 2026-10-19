CREATE OR REPLACE FUNCTION public.compute_order_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it jsonb; p record; new_items jsonb := '[]'::jsonb; t numeric := 0; q int;
BEGIN
  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Pedido vazio';
  END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    SELECT id, name, price, active INTO p FROM products WHERE id = (it->>'productId')::uuid;
    IF NOT FOUND OR NOT p.active THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
    q := GREATEST(1, LEAST(50, COALESCE((it->>'quantity')::int, 1)));
    new_items := new_items || jsonb_build_object('productId', p.id, 'name', p.name, 'price', p.price,
      'size', COALESCE(it->>'size',''), 'quantity', q, 'image_url', it->>'image_url');
    t := t + p.price * q;
  END LOOP;
  NEW.items := new_items;
  NEW.total := t;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_compute_total BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.compute_order_total();