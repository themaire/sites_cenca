SELECT DISTINCT
	--site.uuid_site,
	--COUNT(*),
	geo.uuid_geom, 
	--geo.geom, 
	site.ref_fcen as id_fcen, geo.date_update as date_maj_s, 'CENCHA' as id_cen, 
	
	-- FIN CHAMPS DU SHAPE
	-- DEBUT CSV
	
	'9' as id_cen, site.code as id_site_cen, 
	(SELECT CASE WHEN site.id_mnhn IS NOT NULL THEN site.id_mnhn ELSE 0::CHAR END) as id_site_inpn, 
	site.ref_fcen as id_site_fcen, site.ref_fcen as id_fcen, 
	espa.nom as nom_site, site.id_mnhn as id_rnx_inpn, 
	CASE WHEN espa.typ_espace = 'RNN' THEN 1::char WHEN espa.typ_espace = 'RNR' THEN 2::char ELSE 0::char END as site_lien_rnx,
	
	-- donnée de surface saisie et non basée sur la surface du polygone du site
	CASE WHEN espa.typ_espace like 'RN%' THEN espa.surface*10000::int ELSE 0::int END  as site_rnx_surface_m2, 
	
	0 as ens, 0 as site_cld, 

	CASE 
	 	WHEN espa.typ_espace like 'N2000%' OR espa.typ_espace like 'RN%' THEN right(espa.typ_espace,3) 
	 	ELSE 0::char 
	END as n2000_directives,

    -- donnée de surface basée sur le polygone du site et des polygones N2000-*
	CASE WHEN espa.typ_espace like 'RN%' THEN
		(SELECT ST_AREA(ST_Intersection(
			geo.geom
			,
			(SELECT	ST_UNION(geo.geom) FROM esp.geom_espaces as geo
		 	WHERE geo.typ_espace like 'N2000%' or geo.typ_espace like 'RN%')
		))::int)
	ELSE 0::int END as n2000_surface_m2,
	
	--CASE WHEN typesp.libelle = 'Terrain Militaire' THEN 1 ELSE 0 END as terrain_militaire,
	CASE WHEN site.ref_fcen IN ('CENCHA001', 'CENCHA003', 'CENCHA115', 'CENCHA243', 'CENCHA294', 'CENCHA295', 'CENCHA296', 'CENCHA297', 'CENCHA298') THEN 1 ELSE 0 END as terrain_militaire,
	0 as site_marin, 
	
	---- AGRI A COMPLETER
	--(SELECT count(*) FROM sitcenca.agriculteurs_contrats agri WHERE agri.site = site.uuid_site) as nb_contrat_agri, 
    '0' as nb_contrat_agri,
	'0' as nb_agri, '0' as surf_contra_m2, 
	
	( CASE 
	 	WHEN (SELECT COUNT(*) FROM esp.milieux_naturels WHERE espace = espa.uuid_espace) = 0 THEN NULL
	 	WHEN (SELECT COUNT(*) FROM esp.milieux_naturels WHERE espace = espa.uuid_espace) = 1 
	 		THEN 
				(SELECT 
					id_fcen as milprincipal FROM esp.milieux_naturels
					LEFT JOIN esp.typ_milieuxnat typmilna ON typ_milieu = typmilna.cd_type
					WHERE espace = espa.uuid_espace)
		WHEN (SELECT COUNT(*) FROM esp.milieux_naturels WHERE espace = espa.uuid_espace AND pourcentage IS NOT NULL) > 1
			THEN 
				(SELECT 
					id_fcen as milprincipal FROM esp.milieux_naturels
					LEFT JOIN esp.typ_milieuxnat typmilna ON typ_milieu = typmilna.cd_type
					WHERE espace = espa.uuid_espace
	 				ORDER BY pourcentage DESC LIMIT 1)
	   END
	) as code_milieu_princ,
	
	'T' as nature_site_inpn, 'F' as geol_site_inpn, espa.typ_geologie as code_geol, 
	
	---- CARTO HABITAT A COMPLETER
	'0' as carto_habitats, '0' as typo_carto_habitat, '' as surf_carto_habitat_m2, 
	site.date_crea as date_crea_site, site.modif_admin as date_maj_site, 
	
	CASE 
		WHEN geona.libelle = 'Inconnue' THEN 0::char
		WHEN geona.libelle like 'PCI%' OR geona.libelle like 'BD%' THEN 1::char
		WHEN geona.libelle like 'Num. manuelle%' OR geona.libelle like 'Scan%' THEN 2::char
		WHEN geona.libelle = 'Inconnue' THEN 0::char
		ELSE 3::char
	END as nature_perimetre, 
	 
	geo.typ_source as source_geom_site_nature, 
	geo.annee_source as source_geom_site_date, geo.typ_echelle as echelle_num_site, 'NE' as precision_num_site, 
	'CEN CHAMPAGNE-ARDENNE' as gestionnaire_site, 'FCEN' as operateur, 
	
	(SELECT ST_AREA(ST_UNION(librevo.entites.geom)) FROM librevo.entites WHERE librevo.entites.site = site.uuid_site)::int as surf_libre_evolution_m2, 
	
	-- doc plan de gestion
	(SELECT CASE WHEN (
						SELECT COUNT(*) FROM docplan.documents as docuplan 
						WHERE docuplan.typ_document = 'PDG' AND   docuplan.site = site.uuid_site
						) > 0 
	 		THEN 1 
	 		ELSE 0 
	 		END) as doc_gestion_presence, 
	
	( SELECT document FROM docplan.docplanifsites
	  WHERE uuid_site = site.uuid_site
	  ORDER BY annee_deb DESC LIMIT 1 --site.uuid_site
	) AS doc_gestion_nom,

	-- A FAIRE PAR RAPPORT AU DERNIER PLAN DE GESTION CONNU
	NULL as doc_gestion_evaluation, 
	( SELECT annee_deb FROM docplan.docplanifsites
	  WHERE uuid_site = site.uuid_site-- AND docactuel = 'Oui'
	  ORDER BY annee_deb  LIMIT 1
	) || '/01/01' as doc_gestion_date_ini, 
	( SELECT annee_deb FROM docplan.docplanifsites
	  WHERE uuid_site = site.uuid_site-- AND docactuel = 'Oui'
	  ORDER BY annee_deb DESC LIMIT 1
	) || '/01/01' as doc_gestion_date_maj, 
	( SELECT annee_fin FROM docplan.docplanifsites
	  WHERE uuid_site = site.uuid_site-- AND docactuel = 'Oui'
	  ORDER BY annee_deb DESC LIMIT 1
	) || '/01/01' as doc_gestion_date_fin,
	
	-- PREND LA SURFACE RENSEIGNEE DE TOUS LES PDG. PAS FORCEMENT CELLE DU PGD ACTUELLE
	( SELECT surface FROM docplan.docplanifsites
	  WHERE uuid_site = site.uuid_site AND surface IS NOT NULL
	  LIMIT 1
	) as surf_doc_gestion_m2,
	
	-- PREND LA SURFACE DU PDG ACTUELLE
	--( SELECT surface FROM docplan.docplanifsites
	--  WHERE uuid_site = site.uuid_site-- AND docactuel = 'Oui'
	--  ORDER BY annee_deb DESC LIMIT 1
	--) as surf_doc_gestion_m2_orig,
	
	site.url_mnhn as url_fiche_inpn, site.url_cen as url_fiche_cen, 
	NULL as doc_justif_admin, 
	site.typ_ouverture as ouverture_public, site.description_site as description_site, 
	
	NULL as url_public_site, NULL as url_site_photo, 
	(SELECT CASE WHEN site.sensibilite IS TRUE THEN 1::char ELSE 0::char END) as sensibilite, site.remq_sensibilite as remq_sensibilite,
	
	geo.date_update as date_maj_s
	--, site.uuid_site
	--
	--- A la fin, eleminer les doubles en prenant que la derniere date de plan de gestion
	--
	
	FROM esp.geometries as geo

	LEFT JOIN esp.typ_geomnatures geona ON geo.typ_nature = geona.cd_type
	LEFT JOIN esp.espaces as espa ON geo.espace = espa.uuid_espace
	--LEFT JOIN esp.milieux_naturels milna ON espa.uuid_espace = milna.espace
	--LEFT JOIN esp.typ_milieuxnat typmilna ON milna.typ_milieu = typmilna.cd_type
	LEFT JOIN sitcenca.sites as site ON espa.uuid_espace = site.espace
	--LEFT JOIN sitcenca.typ_sites as tsite ON site.typ_site = tsite.cd_type
	LEFT JOIN sitcenca.actes_mfu as mfu ON site.uuid_site = mfu.site
	LEFT JOIN sitcenca.parcelles_mfu as parmfu ON mfu.uuid_acte = parmfu.acte_mfu
	LEFT JOIN esp.typ_espaces as typesp ON espa.typ_espace = typesp.cd_type
	--LEFT JOIN sitcenca.typ_proprietaires as typepro ON typepro.cd_type = parmfu.typ_proprietaire
	--LEFT JOIN sitcenca.signataires_mfu as signfmu ON signfmu.acte_mfu = mfu.uuid_acte
	--LEFT JOIN sitcenca.signataires as signat ON signat.uuid_sign = signfmu.societe
	--LEFT JOIN sitcenca.agriculteurs_contrats as agri ON agri.site = site.uuid_site
	LEFT JOIN docplan.documents as docplangest ON site.uuid_site = docplangest.site
	
	WHERE (site.typ_site = '1'
	
	--terrains militaires
	OR site.ref_fcen IN ('CENCHA001', 'CENCHA003', 'CENCHA115', 'CENCHA243', 'CENCHA294', 'CENCHA295', 'CENCHA296', 'CENCHA297', 'CENCHA298'))
	
	--AND site.ref_fcen = 'CENCHA256'
	
	-- Voir pourquoi ce site lié à ce geom est en double.
	AND uuid_geom != 'DA828F8B-0672-4900-B78D-0F31E6B2CA44'
	
	--and site.code like '08028'

	--limit 55;
	
	ORDER BY id_site_fcen ASC
	--ORDER BY terrain_militaire DESC
	
	--HAVING COUNT(*) > 1
