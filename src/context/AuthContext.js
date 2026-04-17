const login = async (username, password) => {
    try {
      // 1. Buscamos al usuario en el sistema
      const { data: sysUser, error: sysError } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('username', username)
        .single();

      if (sysError || !sysUser) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // 2. Verificamos la contraseña (texto plano según lo acordado)
      if (sysUser.password_hash !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // 3. Verificamos que esté activo
      if (sysUser.estado !== 'ACTIVO') {
        return { success: false, error: 'Usuario inactivo' };
      }

      // 4. Buscamos sus datos de trabajador usando la columna correcta: dni_trabajador
      const dniParaBuscar = sysUser.dni_trabajador || sysUser.dni_asociado;
      
      let datosTrabajador = null;
      if (dniParaBuscar) {
        const { data: trabajador } = await supabase
          .from('trabajadores')
          .select('*')
          .eq('dni', dniParaBuscar)
          .single();
          
        datosTrabajador = trabajador;
      }

      // 5. Unificamos los datos para que toda la plataforma funcione
      // Le inyectamos ".dni" artificialmente para que no se rompan otras páginas
      const userToSave = {
        ...sysUser,
        dni: dniParaBuscar, 
        nombres_completos: datosTrabajador ? datosTrabajador.nombres_completos : sysUser.nombre,
        cargo_max_id: datosTrabajador ? datosTrabajador.cargo_max_id : null
      };

      // 6. Guardamos la sesión
      setUser(userToSave);
      localStorage.setItem('prodise_user', JSON.stringify(userToSave));
      
      return { success: true };

    } catch (err) {
      console.error("Error en login:", err);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };
