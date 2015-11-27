package it.eng.spagobi.api.v2;

import it.eng.spago.error.EMFUserError;
import it.eng.spagobi.api.AbstractSpagoBIResource;
import it.eng.spagobi.commons.constants.SpagoBIConstants;
import it.eng.spagobi.commons.dao.DAOFactory;
import it.eng.spagobi.profiling.bean.SbiAttribute;
import it.eng.spagobi.profiling.bo.ProfileAttribute;
import it.eng.spagobi.profiling.dao.ISbiAttributeDAO;
import it.eng.spagobi.services.rest.annotations.ManageAuthorization;
import it.eng.spagobi.services.rest.annotations.UserConstraint;
import it.eng.spagobi.utilities.exceptions.SpagoBIRuntimeException;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

import javax.validation.Valid;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.log4j.Logger;

@Path("/2.0/attributes")
@ManageAuthorization
public class ProfileAttributeResource extends AbstractSpagoBIResource {

	private static Logger logger = Logger.getLogger(ProfileAttributeResource.class);

	@GET
	@Path("/")
	@UserConstraint(functionalities = { SpagoBIConstants.PROFILE_MANAGEMENT })
	@Produces(MediaType.APPLICATION_JSON)
	public List<ProfileAttribute> getProfileAttributes() {
		ISbiAttributeDAO objDao = null;
		List<SbiAttribute> attrList = null;
		List<ProfileAttribute> profileAttrs = new ArrayList<>();
		try {
			objDao = DAOFactory.getSbiAttributeDAO();
			objDao.setUserProfile(getUserProfile());
			attrList = objDao.loadSbiAttributes();

			if (attrList != null && !attrList.isEmpty()) {
				for (SbiAttribute attr : attrList) {
					ProfileAttribute pa = new ProfileAttribute(attr);
					profileAttrs.add(pa);
				}
			}

			return profileAttrs;

		} catch (EMFUserError e) {
			// TODO Auto-generated catch block
			logger.error("Error while loading profile attributes", e);
			throw new SpagoBIRuntimeException("Error loading profile attributes");
		}

	}

	@PUT
	@Path("/{id}")
	@UserConstraint(functionalities = { SpagoBIConstants.PROFILE_MANAGEMENT })
	@Consumes(MediaType.APPLICATION_JSON)
	public Response updateAttribute(@PathParam("id") Integer id, @Valid ProfileAttribute attr) {
		ISbiAttributeDAO objDao = null;
		ProfileAttribute attribute = attr;

		if (attribute == null) {
			return Response.status(Status.BAD_REQUEST).entity("Error JSON parsing").build();
		}

		if (attribute.getAttributeId() == null) {
			return Response.status(Status.NOT_FOUND).entity("The domain with ID " + id + " doesn't exist").build();
		}

		try {
			objDao = DAOFactory.getSbiAttributeDAO();
			objDao.setUserProfile(getUserProfile());
			SbiAttribute sa = new SbiAttribute(attribute.getAttributeId(), attribute.getAttributeName(), attribute.getAttributeDescription());

			objDao.saveOrUpdateSbiAttribute(sa);
			String encodedAttribute = URLEncoder.encode("" + attribute.getAttributeId(), "UTF-8");
			return Response.created(new URI("2.0/attributes/" + encodedAttribute)).entity(encodedAttribute).build();

		} catch (EMFUserError e) {
			logger.error("Error while updating profile attribute", e);
			throw new SpagoBIRuntimeException("Error updating profile attribute");
		} catch (UnsupportedEncodingException e) {
			logger.error("Error while updating url of the new resource", e);
			throw new SpagoBIRuntimeException("Error while updating url of the new resource", e);

		} catch (URISyntaxException e) {
			logger.error("Error while updating url of the new resource", e);
			throw new SpagoBIRuntimeException("Error while updating url of the new resource", e);
		}

	}

	@POST
	@Path("/")
	@UserConstraint(functionalities = { SpagoBIConstants.PROFILE_MANAGEMENT })
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public ProfileAttribute insertAttribute(@Valid ProfileAttribute attr) {
		ISbiAttributeDAO objDao = null;
		ProfileAttribute attribute = attr;

		/*
		 * if (attribute == null) { return
		 * Response.status(Status.BAD_REQUEST).entity
		 * ("Error JSON parsing").build(); }
		 *
		 * if (attribute.getAttributeId() != null) { return
		 * Response.status(Status.BAD_REQUEST).entity(
		 * "Error paramters. New attribute should not have ID value").build(); }
		 */

		try {
			objDao = DAOFactory.getSbiAttributeDAO();
			objDao.setUserProfile(getUserProfile());
			SbiAttribute sa = new SbiAttribute();
			sa.setAttributeName(attribute.getAttributeName());
			sa.setDescription(attribute.getAttributeDescription());
			Integer id = objDao.saveSbiAttribute(sa);
			attribute.setAttributeId(id);

			String encodedAttribute = URLEncoder.encode("" + attribute.getAttributeId(), "UTF-8");
			// return Response.created(new URI("2.0/attributes/" +
			// encodedAttribute)).entity(attribute).build();
			return attribute;
		} catch (EMFUserError e) {
			logger.error("Error while saving profile attribute", e);
			throw new SpagoBIRuntimeException("Error saving profile attribute");

		} catch (UnsupportedEncodingException e) {
			logger.error("Error while saving profile attribute", e);
			throw new SpagoBIRuntimeException("Error saving profile attribute");

		} /*
		 * catch (URISyntaxException e) {
		 * logger.error("Error while saving profile attribute", e); throw new
		 * SpagoBIRuntimeException("Error saving profile attribute");
		 * 
		 * }
		 */
	}

	@DELETE
	@Path("/{id}")
	@UserConstraint(functionalities = { SpagoBIConstants.PROFILE_MANAGEMENT })
	public Response removeAttribute(@PathParam("id") Integer id) {
		ISbiAttributeDAO objDao = null;
		try {
			objDao = DAOFactory.getSbiAttributeDAO();
			objDao.setUserProfile(getUserProfile());
			objDao.deleteSbiAttributeById(id);
			return Response.ok().build();
		} catch (EMFUserError e) {
			logger.error("Error while deleting resource", e);
			throw new SpagoBIRuntimeException("Error while deleting resource", e);

		}
	}

}
